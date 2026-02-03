import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { ScenarioEntity } from '../../domain/entities/scenario.entity';
import { ScenarioGenerationError, InvalidScenarioDataError } from '../../domain/errors/scenario.error';
import { ScenarioRepositoryPort } from '../ports/scenario-repository.port';
import { LLMServicePort } from '../ports/llm-service.port';
import { GenerateScenarioUseCaseRequest, GenerateScenarioUseCaseResponse } from './input-output/generate-scenario.io';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { TYPES as PROJECT_TYPES } from '../../../projects/infrastructure/bootstrap/types';
import { ProjectRepositoryPort } from '../../../projects/application/ports/project-repository.port';
import { ProjectNotFoundError, ProjectAccessDeniedError } from '../../../projects/domain/errors/project.error';

@injectable()
export class GenerateScenarioUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(TYPES.ScenarioRepository)
    private readonly _repository: ScenarioRepositoryPort,
    @inject(TYPES.LLMService)
    private readonly _llmService: LLMServicePort,
    @inject(PROJECT_TYPES.ProjectRepository)
    private readonly _projectRepository: ProjectRepositoryPort
  ) {}

  async execute(
    request: GenerateScenarioUseCaseRequest
  ): Promise<ResultEx<GenerateScenarioUseCaseResponse, ScenarioGenerationError | InvalidScenarioDataError | ProjectNotFoundError | ProjectAccessDeniedError>> {
    this._logger.info('generate-scenario.start', { projectId: request.projectId, userId: request.userId });

    try {
      // Step 1: Validate project exists and belongs to user
      const projectResult = await this._projectRepository.findById(request.projectId);
      if (!projectResult.isSuccess) {
        this._logger.error('generate-scenario.project-not-found', { projectId: request.projectId });
        return ResultEx.failure(projectResult.error);
      }

      const project = projectResult.data;

      // Validate project ownership
      if (project.userId !== request.userId) {
        this._logger.warn('generate-scenario.access-denied', { projectId: request.projectId, userId: request.userId, projectUserId: project.userId });
        return ResultEx.failure(new ProjectAccessDeniedError(request.projectId, request.userId));
      }

      // Step 2: Get segment, hypothesis, and marketContext from request or fallback to project
      const segment = request.segment ?? project.segment;
      const hypothesis = request.hypothesis ?? project.hypothesis;
      const marketContext = request.marketContext ?? project.marketContext ?? null;

      // Step 3: Get latest version to increment (for versioning)
      const versionResult = await this._repository.getLatestVersion(request.projectId);
      const nextVersion = versionResult.isSuccess ? versionResult.data + 1 : 1;

      // Step 4: Generate scenario via LLM
      // LLM service will form the prompt based on:
      // - segment.description, segment.demographics
      // - hypothesis.description, hypothesis.assumptions
      // - custom prompt if provided
      const llmResult = await this._llmService.generateScenario({
        projectId: request.projectId,
        segment: segment,
        hypothesis: hypothesis,
        marketContext,
        metadata: request.metadata,
        prompt: request.prompt, // Pass custom prompt if provided
      });

      if (!llmResult.isSuccess) {
        this._logger.error('generate-scenario.llm-error', { error: llmResult.error });
        return ResultEx.failure(llmResult.error);
      }

      // Step 5: Create scenario entity with required fields
      const scenario = ScenarioEntity.create(
        request.projectId,
        llmResult.data.content,
        true, // isGenerated = true (per requirements)
        llmResult.data.metadata // metadata with tone, length, branches
      ).withVersion(nextVersion); // version = last version + 1 (or 1 if none)

      // isEdited = false by default in ScenarioEntity.create

      // Step 6: Save to repository
      const saveResult = await this._repository.create(scenario.toData());

      if (!saveResult.isSuccess) {
        this._logger.error('generate-scenario.save-error', { error: saveResult.error });
        return ResultEx.failure(saveResult.error);
      }

      this._logger.info('generate-scenario.success', { scenarioId: saveResult.data.id, version: nextVersion });

      // Compute status based on isGenerated and isEdited
      let status: 'draft' | 'generated' | 'approved' | 'rejected';
      if (!saveResult.data.isGenerated && !saveResult.data.isEdited) {
        status = 'draft';
      } else if (saveResult.data.isGenerated && !saveResult.data.isEdited) {
        status = 'generated';
      } else if (saveResult.data.isGenerated && saveResult.data.isEdited) {
        status = 'approved';
      } else {
        status = 'draft';
      }

      return ResultEx.success({
        scenario: {
          ...saveResult.data,
          status,
          // Keep dates as Date objects - will be serialized to ISO 8601 in routes
        },
      });
    } catch (error) {
      this._logger.error('generate-scenario.error', { error });
      if (error instanceof ScenarioGenerationError || error instanceof InvalidScenarioDataError) {
        return ResultEx.failure(error);
      }
      return ResultEx.failure(
        new ScenarioGenerationError(error instanceof Error ? error.message : 'Unknown error')
      );
    }
  }
}

