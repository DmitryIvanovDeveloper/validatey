import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { ProjectRepositoryPort } from '../../../projects/application/ports/project-repository.port';
import { TYPES as PROJECT_TYPES } from '../../../projects/infrastructure/bootstrap/types';
import { ProjectAccessDeniedError, ProjectNotFoundError } from '../../../projects/domain/errors/project.error';
import { TYPES } from '../../infrastructure/bootstrap/types';
import type { ProjectTranscriptionRepositoryPort } from '../ports/project-transcription-repository.port';
import { TranscriptionPersistenceError } from '../../domain/errors/transcription.error';
import { ProjectTranscriptionEntity } from '../../domain/entities/project-transcription.entity';

export interface ListProjectTranscriptsRequest {
  projectId: string;
  userId: string;
  limit?: number;
  offset?: number;
}

const DEFAULT_LIMIT = 50;

@injectable()
export class ListProjectTranscriptsUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(PROJECT_TYPES.ProjectRepository)
    private readonly _projectRepository: ProjectRepositoryPort,
    @inject(TYPES.ProjectTranscriptionRepository)
    private readonly _transcriptionRepository: ProjectTranscriptionRepositoryPort
  ) {}

  async execute(
    request: ListProjectTranscriptsRequest
  ): Promise<
    ResultEx<ProjectTranscriptionEntity[], ProjectNotFoundError | ProjectAccessDeniedError | TranscriptionPersistenceError>
  > {
    const { projectId, userId, limit = DEFAULT_LIMIT, offset = 0 } = request;

    const projectResult = await this._projectRepository.findById(projectId);
    if (!projectResult.isSuccess) {
      return ResultEx.failure(projectResult.error);
    }
    if (projectResult.data.userId !== userId) {
      this._logger.warn('list-project-transcripts.access-denied', { projectId, userId });
      return ResultEx.failure(new ProjectAccessDeniedError(projectId, userId));
    }

    return this._transcriptionRepository.listByProjectId(projectId, limit, offset);
  }
}
