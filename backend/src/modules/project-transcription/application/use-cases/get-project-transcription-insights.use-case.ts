import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { ProjectRepositoryPort } from '../../../projects/application/ports/project-repository.port';
import { TYPES as PROJECT_TYPES } from '../../../projects/infrastructure/bootstrap/types';
import { ProjectAccessDeniedError, ProjectNotFoundError } from '../../../projects/domain/errors/project.error';
import { TYPES } from '../../infrastructure/bootstrap/types';
import type { ProjectTranscriptionRepositoryPort } from '../ports/project-transcription-repository.port';
import type { TranscriptionInsightsOutput } from '../ports/transcription-insights-llm.port';
import { TranscriptionInsightsPersistenceError } from '../../domain/errors/transcription.error';

export interface GetProjectTranscriptionInsightsRequest {
  projectId: string;
  userId: string;
}

@injectable()
export class GetProjectTranscriptionInsightsUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(PROJECT_TYPES.ProjectRepository)
    private readonly _projectRepository: ProjectRepositoryPort,
    @inject(TYPES.ProjectTranscriptionRepository)
    private readonly _transcriptionRepository: ProjectTranscriptionRepositoryPort
  ) {}

  async execute(
    request: GetProjectTranscriptionInsightsRequest
  ): Promise<
    ResultEx<
      TranscriptionInsightsOutput | null,
      ProjectNotFoundError | ProjectAccessDeniedError | TranscriptionInsightsPersistenceError
    >
  > {
    const { projectId, userId } = request;
    const projectResult = await this._projectRepository.findById(projectId);
    if (!projectResult.isSuccess) return ResultEx.failure(projectResult.error);
    if (projectResult.data.userId !== userId) {
      this._logger.warn('get-transcription-insights.access-denied', { projectId, userId });
      return ResultEx.failure(new ProjectAccessDeniedError(projectId, userId));
    }
    return this._transcriptionRepository.getInsightsByProjectId(projectId);
  }
}
