import { injectable, inject } from 'inversify';
import type { CreateProjectUseCase } from '../../application/use-cases/create-project.use-case';
import type { GetProjectUseCase } from '../../application/use-cases/get-project.use-case';
import type { UpdateProjectUseCase } from '../../application/use-cases/update-project.use-case';
import type { GetMarketContextSuggestionUseCase } from '../../application/use-cases/get-market-context-suggestion.use-case';
import type { AssessProjectRiskUseCase } from '../../application/use-cases/assess-project-risk.use-case';
import { ProjectViewModel } from '../view-models/project.view-model';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import { Segment } from '../../domain/value-objects/segment.vo';
import { Hypothesis } from '../../domain/value-objects/hypothesis.vo';
import { Project, ProjectStatus, MarketContext } from '../../domain/entities/project.entity';
import type { ProjectRisk, ProjectRiskAssessment } from '../../domain/entities/project-risk.entity';
import type { GetMarketContextSuggestionRequest } from '../../application/use-cases/input-output/get-market-context-suggestion.io';

@injectable()
export class ProjectPresenter {
  constructor(
    @inject(TYPES.CreateProjectUseCase)
    private readonly _createProjectUseCase: CreateProjectUseCase,
    @inject(TYPES.GetProjectUseCase)
    private readonly _getProjectUseCase: GetProjectUseCase,
    @inject(TYPES.UpdateProjectUseCase)
    private readonly _updateProjectUseCase: UpdateProjectUseCase,
    @inject(TYPES.GetMarketContextSuggestionUseCase)
    private readonly _getMarketContextSuggestionUseCase: GetMarketContextSuggestionUseCase,
    @inject(TYPES.AssessProjectRiskUseCase)
    private readonly _assessProjectRiskUseCase: AssessProjectRiskUseCase,
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}
  
  async createProject(
    name: string,
    segmentDescription?: string,
    segmentDemographics?: string,
    hypothesisDescription?: string,
    hypothesisAssumptions?: string[],
    marketContext?: MarketContext | null,
    scenarioTemplateSlug?: string,
    workspaceId?: string | null
  ): Promise<{ projectId: string | null; error?: string }> {
    try {
      // Валидация и создание Segment
      let segment: Segment | null = null;
      if (segmentDescription && segmentDescription.trim().length > 0 && segmentDemographics && segmentDemographics.trim().length > 0) {
        try {
          let demographicsParsed: Record<string, unknown> = {};
          try {
            demographicsParsed = (typeof segmentDemographics === 'string'
              ? JSON.parse(segmentDemographics)
              : segmentDemographics) as Record<string, unknown>;
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
      const result = await this._createProjectUseCase.execute({
        name,
        workspaceId: workspaceId ?? undefined,
      });

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

  async getProject(projectId: string): Promise<{ project: Project | null; error?: string }> {
    const result = await this._getProjectUseCase.execute({ projectId });
    if (!result.isSuccess) {
      return { project: null, error: result.error?.message ?? 'Failed to load project' };
    }
    const projectData = result.data.project;
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
      new Date(projectData.updatedAt),
      undefined,
      undefined,
      undefined,
      undefined,
      projectData.publicAccessEnabled ?? false,
      projectData.publicSlug ?? null,
      projectData.maxPublicResponses ?? null,
      projectData.requirePublicEmail ?? false,
      projectData.captchaEnabled ?? false
    );
    return { project };
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
        new Date(projectData.updatedAt),
        undefined,
        undefined,
        undefined,
        undefined,
        projectData.publicAccessEnabled ?? false,
        projectData.publicSlug ?? null,
        projectData.maxPublicResponses ?? null,
        projectData.requirePublicEmail ?? false,
        projectData.captchaEnabled ?? false,
        projectData.scenarioTemplateSlug ?? null
      );
      
      console.log('Presenter: Setting project to viewModel', project);
      viewModel.project.value = project;
      console.log('Presenter: viewModel.project.value set to', viewModel.project.value);
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
    segmentDemographics?: string | Record<string, unknown>,
    hypothesisDescription?: string,
    hypothesisAssumptions?: string[],
    status?: string,
    marketContext?: MarketContext | null,
    scenarioTemplateSlug?: string | null,
    consentText?: string | null,
    dataUsageText?: string | null,
    privacyPolicyUrl?: string | null,
    termsOfServiceUrl?: string | null,
    publicAccessEnabled?: boolean,
    publicSlug?: string | null,
    maxPublicResponses?: number | null,
    requirePublicEmail?: boolean,
    captchaEnabled?: boolean
  ): Promise<{ ok: boolean; error?: string; project?: { publicAccessEnabled?: boolean; publicSlug?: string | null; maxPublicResponses?: number | null; requirePublicEmail?: boolean; captchaEnabled?: boolean } }> {
    try {
      let segment: Segment | undefined = undefined;
      if (segmentDescription && segmentDescription.trim().length > 0 && segmentDemographics) {
        try {
          let demographicsParsed: Record<string, unknown> = {};
          if (typeof segmentDemographics === 'string') {
            try {
              demographicsParsed = JSON.parse(segmentDemographics) as Record<string, unknown>;
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
          status: status as ProjectStatus | undefined,
          marketContext: marketContext ?? undefined,
          scenarioTemplateSlug: scenarioTemplateSlug ?? undefined,
          consentText: consentText ?? undefined,
          dataUsageText: dataUsageText ?? undefined,
          privacyPolicyUrl: privacyPolicyUrl ?? undefined,
          termsOfServiceUrl: termsOfServiceUrl ?? undefined,
          publicAccessEnabled: publicAccessEnabled ?? undefined,
          publicSlug: publicSlug ?? undefined,
          maxPublicResponses: maxPublicResponses ?? undefined,
          requirePublicEmail: requirePublicEmail ?? undefined,
          captchaEnabled: captchaEnabled ?? undefined,
        },
      });

      if (result.isSuccess) {
        this._logger.info('Project updated', { projectId });
        return { ok: true, project: result.data.project };
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

  async updateProjectViewModel(
    projectId: string,
    updates: {
      name?: string;
      segmentDescription?: string;
      segmentDemographics?: string | Record<string, unknown>;
      hypothesisDescription?: string;
      hypothesisAssumptions?: string[];
      status?: string;
      marketContext?: MarketContext | null;
    },
    viewModel: ProjectViewModel
  ): Promise<void> {
    viewModel.loading.value = true;
    viewModel.error.value = null;

    const result = await this.updateProject(
      projectId,
      updates.name,
      updates.segmentDescription,
      updates.segmentDemographics,
      updates.hypothesisDescription,
      updates.hypothesisAssumptions,
      updates.status,
      updates.marketContext
    );

    if (result.ok) {
      viewModel.loading.value = false;
      this._logger.info('Project updated', { projectId });
    } else {
      viewModel.error.value = 'Failed to update project';
      viewModel.loading.value = false;
    }
  }

  async getMarketContextSuggestions(
    segmentDescription: string,
    segmentDemographics: string,
    productDescription?: string
  ): Promise<{ marketPicture?: string; marketFit?: string; differentiation?: string } | null> {
    try {
      const request: GetMarketContextSuggestionRequest = {
        segmentDescription,
        segmentDemographics,
        productDescription,
      };

      const result = await this._getMarketContextSuggestionUseCase.execute(request);

      if (result.isSuccess) {
        this._logger.info('Market context suggestions retrieved successfully');
        return result.data;
      } else {
        this._logger.error('Failed to get market context suggestions', { error: result.error });
        throw result.error;
      }
    } catch (error) {
      this._logger.error('Unexpected error getting market context suggestions', { error });
      throw error instanceof Error ? error : new Error('Failed to get market context suggestions');
    }
  }

  async assessProjectRisk(
    hypothesis: string,
    segment: string,
    assumptions: string[]
  ): Promise<{ risks: ProjectRisk[]; overallRiskScore: number }> {
    try {
      const assessment = await this._assessProjectRiskUseCase.execute(hypothesis, segment, assumptions);
      return { risks: Array.from(assessment.risks), overallRiskScore: assessment.overallRiskScore };
    } catch (error) {
      this._logger.warn('Risk assessment failed, returning empty result', { error });
      return { risks: [], overallRiskScore: 0 };
    }
  }
}

