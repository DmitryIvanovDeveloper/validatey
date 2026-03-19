import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { ProjectRepositoryPort } from '../../../projects/application/ports/project-repository.port';
import { TYPES as PROJECT_TYPES } from '../../../projects/infrastructure/bootstrap/types';
import { ProjectAccessDeniedError, ProjectNotFoundError } from '../../../projects/domain/errors/project.error';
import { TYPES } from '../../infrastructure/bootstrap/types';
import type { ProjectTranscriptionRepositoryPort } from '../ports/project-transcription-repository.port';
import type {
  TranscriptionInsightsLlmPort,
  TranscriptionInsightsOutput,
} from '../ports/transcription-insights-llm.port';
import {
  NoTranscriptionsForInsightsError,
  TranscriptionInsightsGenerationError,
  TranscriptionInsightsPersistenceError,
  TranscriptionPersistenceError,
} from '../../domain/errors/transcription.error';

const INSIGHTS_HISTORY_LIMIT = 500;

export interface GenerateProjectTranscriptionInsightsRequest {
  projectId: string;
  userId: string;
}

@injectable()
export class GenerateProjectTranscriptionInsightsUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(PROJECT_TYPES.ProjectRepository)
    private readonly _projectRepository: ProjectRepositoryPort,
    @inject(TYPES.ProjectTranscriptionRepository)
    private readonly _transcriptionRepository: ProjectTranscriptionRepositoryPort,
    @inject(TYPES.TranscriptionInsightsLlmPort)
    private readonly _insightsLlm: TranscriptionInsightsLlmPort
  ) {}

  async execute(
    request: GenerateProjectTranscriptionInsightsRequest
  ): Promise<
    ResultEx<
      TranscriptionInsightsOutput,
      | ProjectNotFoundError
      | ProjectAccessDeniedError
      | NoTranscriptionsForInsightsError
      | TranscriptionPersistenceError
      | TranscriptionInsightsPersistenceError
      | TranscriptionInsightsGenerationError
    >
  > {
    const { projectId, userId } = request;

    const projectResult = await this._projectRepository.findById(projectId);
    if (!projectResult.isSuccess) {
      return ResultEx.failure(projectResult.error);
    }
    if (projectResult.data.userId !== userId) {
      this._logger.warn('generate-transcription-insights.access-denied', { projectId, userId });
      return ResultEx.failure(new ProjectAccessDeniedError(projectId, userId));
    }

    const listResult = await this._transcriptionRepository.listByProjectId(projectId, INSIGHTS_HISTORY_LIMIT, 0);
    if (!listResult.isSuccess) {
      return ResultEx.failure(listResult.error);
    }
    if (listResult.data.length === 0) {
      return ResultEx.failure(new NoTranscriptionsForInsightsError(projectId));
    }

    const llmResult = await this._insightsLlm.generateInsights({
      projectId,
      history: listResult.data.map((t) => ({
        id: t.id,
        originalFilename: t.originalFilename,
        createdAtIso: t.createdAt.toISOString(),
        transcript: t.transcript,
        language: t.language,
      })),
    });

    if (!llmResult.isSuccess) {
      return ResultEx.failure(llmResult.error);
    }

    const saveResult = await this._transcriptionRepository.saveInsights({
      projectId,
      userId,
      payload: llmResult.data,
    });
    if (!saveResult.isSuccess) {
      return ResultEx.failure(saveResult.error);
    }

    return ResultEx.success(saveResult.data);
  }
}
