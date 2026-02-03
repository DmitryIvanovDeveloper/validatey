import { injectable, inject } from 'inversify';
import type { CreateProjectUseCase } from '../../application/use-cases/create-project.use-case';
import type { GetProjectUseCase } from '../../application/use-cases/get-project.use-case';
import type { UpdateProjectUseCase } from '../../application/use-cases/update-project.use-case';
import { ProjectViewModel } from '../view-models/project.view-model';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import { Segment } from '../../domain/value-objects/segment.vo';
import { Hypothesis } from '../../domain/value-objects/hypothesis.vo';
import { Project, ProjectStatus, MarketContext } from '../../domain/entities/project.entity';

@injectable()
export class ProjectPresenter {
  constructor(
    @inject(TYPES.CreateProjectUseCase)
    private readonly _createProjectUseCase: CreateProjectUseCase,
    @inject(TYPES.GetProjectUseCase)
    private readonly _getProjectUseCase: GetProjectUseCase,
    @inject(TYPES.UpdateProjectUseCase)
    private readonly _updateProjectUseCase: UpdateProjectUseCase,
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}
  
  async createProject(
    name: string,
    segmentDescription?: string,
    segmentDemographics?: string,
    hypothesisDescription?: string,
    hypothesisAssumptions?: string[],
    marketContext?: MarketContext | null
  ): Promise<{ projectId: string | null; error?: string }> {
    try {
      // Валидация и создание Segment
      let segment: Segment | null = null;
      if (segmentDescription && segmentDescription.trim().length > 0 && segmentDemographics && segmentDemographics.trim().length > 0) {
        try {
          let demographicsParsed: Record<string, any> = {};
          try {
            demographicsParsed = typeof segmentDemographics === 'string'
              ? JSON.parse(segmentDemographics)
              : segmentDemographics;
          } catch {
            demographicsParsed = { text: segmentDemographics };
          }
          segment = new Segment(segmentDescription.trim(), demographicsParsed);
        } catch (error) {
          this._logger.warn('Failed to create Segment, continuing without it', { error });
          segment = null;
        }
      }

      // Валидация и создание Hypothesis
      let hypothesis: Hypothesis | null = null;
      if (hypothesisDescription && hypothesisDescription.trim().length > 0) {
        try {
          const validAssumptions = hypothesisAssumptions 
            ? hypothesisAssumptions.filter(a => a && a.trim().length > 0)
            : [];
          if (validAssumptions.length > 0) {
            hypothesis = new Hypothesis(hypothesisDescription.trim(), validAssumptions);
          } else {
            // Hypothesis может быть создан и без assumptions
            hypothesis = new Hypothesis(hypothesisDescription.trim(), []);
          }
        } catch (error) {
          this._logger.warn('Failed to create Hypothesis, continuing without it', { error });
          hypothesis = null;
        }
      }

      // Создаём проект
      console.log('🔄 Creating project with name:', name);
      const result = await this._createProjectUseCase.execute({ name });

      if (!result.isSuccess) {
        // Безопасное извлечение сообщения об ошибке
        let errorMessage = 'Unknown error';
        if (result.error instanceof Error) {
          errorMessage = result.error.message;
        } else if (typeof result.error === 'string') {
          errorMessage = result.error;
        } else {
          errorMessage = JSON.stringify(result.error);
        }
        
        this._logger.error('Failed to create project', { 
          error: errorMessage,
          errorDetails: result.error 
        });
        console.error('❌ Failed to create project. Error:', errorMessage);
        return { projectId: null, error: errorMessage };
      }

      const projectId = result.data.project.id;
      console.log('✅ Project created with ID:', projectId);
      
      // Обновляем проект с segment, hypothesis и marketContext, если есть
      if (segment || hypothesis || marketContext) {
        console.log('🔄 Updating project with segment/hypothesis/marketContext');
        const updateResult = await this._updateProjectUseCase.execute({
          projectId,
          updates: {
            segment: segment || undefined,
            hypothesis: hypothesis || undefined,
            marketContext: marketContext ?? undefined,
          },
        });

        if (!updateResult.isSuccess) {
          this._logger.warn('Failed to update project with segment/hypothesis, but project was created', {
            projectId,
            error: updateResult.error
          });
          // Не возвращаем null, проект уже создан
        } else {
          console.log('✅ Project updated with segment/hypothesis');
        }
      }
      
      this._logger.info('Project created successfully', { projectId });
      return { projectId };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this._logger.error('Unexpected error during project creation', { 
        error: errorMessage,
        errorDetails: error 
      });
      console.error('❌ Unexpected error:', error);
      return { projectId: null, error: errorMessage };
    }
  }

  async loadProject(projectId: string, viewModel: ProjectViewModel): Promise<void> {
    viewModel.loading.value = true;
    viewModel.error.value = null;

    const result = await this._getProjectUseCase.execute({ projectId });

    if (result.isSuccess) {
      const projectData = result.data.project;
      
      // Маппим ответ на Project entity
      const segment = projectData.segment 
        ? new Segment(projectData.segment.description, projectData.segment.demographics)
        : null;
      
      const hypothesis = projectData.hypothesis
        ? new Hypothesis(projectData.hypothesis.description, projectData.hypothesis.assumptions || [])
        : null;
      
      const project = new Project(
        projectData.id,
        projectData.name,
        segment,
        hypothesis,
        projectData.marketContext ?? null,
        projectData.status as ProjectStatus,
        new Date(projectData.createdAt),
        new Date(projectData.updatedAt)
      );
      
      viewModel.project.value = project;
      viewModel.loading.value = false;
      this._logger.info('Project loaded', { projectId });
    } else {
      // Безопасное извлечение сообщения об ошибке
      const errorMessage = result.error instanceof Error
        ? result.error.message
        : typeof result.error === 'string'
          ? result.error
          : 'Failed to load project';
      viewModel.error.value = errorMessage;
      viewModel.loading.value = false;
      this._logger.error('Failed to load project', { projectId, error: result.error });
    }
  }

  async updateProject(
    projectId: string,
    name?: string,
    segmentDescription?: string,
    segmentDemographics?: string | Record<string, any>,
    hypothesisDescription?: string,
    hypothesisAssumptions?: string[],
    status?: string,
    marketContext?: MarketContext | null
  ): Promise<{ ok: boolean; error?: string }> {
    try {
      let segment: Segment | undefined = undefined;
      if (segmentDescription && segmentDescription.trim().length > 0 && segmentDemographics) {
        try {
          let demographicsParsed: Record<string, any> = {};
          if (typeof segmentDemographics === 'string') {
            try {
              demographicsParsed = JSON.parse(segmentDemographics);
            } catch {
              demographicsParsed = { text: segmentDemographics };
            }
          } else {
            demographicsParsed = segmentDemographics;
          }
          segment = new Segment(segmentDescription.trim(), demographicsParsed);
        } catch (error) {
          this._logger.warn('Failed to create Segment for update', { error });
          segment = undefined;
        }
      }
      
      let hypothesis: Hypothesis | undefined = undefined;
      if (hypothesisDescription && hypothesisDescription.trim().length > 0) {
        try {
          const validAssumptions = hypothesisAssumptions && hypothesisAssumptions.length > 0
            ? hypothesisAssumptions.filter(a => a && a.trim().length > 0)
            : [];
          hypothesis = new Hypothesis(hypothesisDescription.trim(), validAssumptions);
        } catch (error) {
          this._logger.warn('Failed to create Hypothesis for update', { error });
          hypothesis = undefined;
        }
      }

      const result = await this._updateProjectUseCase.execute({
        projectId,
        updates: {
          name,
          segment,
          hypothesis,
          status: status as any,
          marketContext: marketContext ?? undefined,
        },
      });

      if (result.isSuccess) {
        this._logger.info('Project updated', { projectId });
        return { ok: true };
      } else {
        const errorMessage = result.error instanceof Error
          ? result.error.message
          : typeof result.error === 'string'
            ? result.error
            : 'Failed to update project';
        this._logger.error('Failed to update project', { projectId, error: errorMessage, errorDetails: result.error });
        return { ok: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this._logger.error('Unexpected error during project update', { projectId, error: errorMessage, errorDetails: error });
      return { ok: false, error: errorMessage };
    }
  }

  async updateProjectViewModel(projectId: string, updates: any, viewModel: ProjectViewModel): Promise<void> {
    viewModel.loading.value = true;
    viewModel.error.value = null;

    const result = await this.updateProject(projectId, updates.name, updates.segmentDescription, updates.segmentDemographics, updates.hypothesisDescription, updates.hypothesisAssumptions, updates.status, updates.marketContext);

    if (result.ok) {
      viewModel.loading.value = false;
      this._logger.info('Project updated', { projectId });
    } else {
      viewModel.error.value = 'Failed to update project';
      viewModel.loading.value = false;
    }
  }
}

