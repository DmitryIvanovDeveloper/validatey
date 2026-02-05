import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { ResponseRepositoryPort } from '../ports/response-repository.port';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { ListResponsesForModerationUseCaseRequest, ListResponsesForModerationUseCaseResponse } from './input-output/list-responses-for-moderation.io';
import { ProjectRepositoryPort } from '../../../projects/application/ports/project-repository.port';
import { TYPES as PROJECT_TYPES } from '../../../projects/infrastructure/bootstrap/types';
import { ProjectNotFoundError, ProjectAccessDeniedError } from '../../../projects/domain/errors/project.error';

@injectable()
export class ListResponsesForModerationUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(TYPES.ResponseRepository)
    private readonly _responseRepository: ResponseRepositoryPort,
    @inject(PROJECT_TYPES.ProjectRepository)
    private readonly _projectRepository: ProjectRepositoryPort
  ) {}

  async execute(
    request: ListResponsesForModerationUseCaseRequest
  ): Promise<ResultEx<ListResponsesForModerationUseCaseResponse, ProjectNotFoundError | ProjectAccessDeniedError | Error>> {
    this._logger.info('list-responses-for-moderation.start', { projectId: request.projectId });

    const projectResult = await this._projectRepository.findById(request.projectId);
    if (!projectResult.isSuccess) {
      return ResultEx.failure(projectResult.error);
    }
    if (projectResult.data.userId !== request.userId) {
      return ResultEx.failure(new ProjectAccessDeniedError(request.projectId, request.userId));
    }

    const listResult = await this._responseRepository.listByProjectId(request.projectId, {
      moderationStatus: request.moderationStatus ?? undefined,
    });
    if (!listResult.isSuccess) {
      this._logger.error('list-responses-for-moderation.list-error', { error: listResult.error });
      return ResultEx.failure(listResult.error);
    }

    const responses = listResult.data.map((res) => ({
      id: res.id,
      invitationId: res.invitationId,
      projectId: res.projectId,
      answers: res.answers,
      audioUrl: res.audioUrl,
      transcript: res.transcript,
      moderationStatus: res.moderationStatus,
      createdAt: res.createdAt,
      updatedAt: res.updatedAt,
    }));

    this._logger.info('list-responses-for-moderation.success', { projectId: request.projectId, count: responses.length });
    return ResultEx.success({ responses });
  }
}
