import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { ResponseEntity } from '../../domain/entities/response.entity';
import { ResponseRepositoryPort } from '../ports/response-repository.port';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { ModerateResponseUseCaseRequest, ModerateResponseUseCaseResponse } from './input-output/moderate-response.io';
import { ProjectRepositoryPort } from '../../../projects/application/ports/project-repository.port';
import { TYPES as PROJECT_TYPES } from '../../../projects/infrastructure/bootstrap/types';
import { ResponseNotFoundError, ModerationNotAllowedError } from '../../domain/errors/response.error';
import { ProjectNotFoundError, ProjectAccessDeniedError } from '../../../projects/domain/errors/project.error';

@injectable()
export class ModerateResponseUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(TYPES.ResponseRepository)
    private readonly _responseRepository: ResponseRepositoryPort,
    @inject(PROJECT_TYPES.ProjectRepository)
    private readonly _projectRepository: ProjectRepositoryPort
  ) {}

  async execute(
    request: ModerateResponseUseCaseRequest
  ): Promise<
    ResultEx<
      ModerateResponseUseCaseResponse,
      ResponseNotFoundError | ModerationNotAllowedError | ProjectNotFoundError | ProjectAccessDeniedError
    >
  > {
    this._logger.info('moderate-response.start', { responseId: request.responseId, status: request.status });

    const responseResult = await this._responseRepository.findById(request.responseId);
    if (!responseResult.isSuccess) {
      return ResultEx.failure(responseResult.error);
    }
    const response = responseResult.data;

    const projectResult = await this._projectRepository.findById(response.projectId);
    if (!projectResult.isSuccess) {
      return ResultEx.failure(projectResult.error);
    }
    if (projectResult.data.userId !== request.userId) {
      return ResultEx.failure(new ProjectAccessDeniedError(response.projectId, request.userId));
    }

    const entity = ResponseEntity.fromData(response);
    try {
      const updated = entity.withModerationStatus(request.status);
      const updateResult = await this._responseRepository.updateModerationStatus(request.responseId, request.status);
      if (!updateResult.isSuccess) {
        return ResultEx.failure(updateResult.error);
      }
      const updatedResponse = updateResult.data;
      this._logger.info('moderate-response.success', { responseId: request.responseId });
      return ResultEx.success({
        response: {
          id: updatedResponse.id,
          invitationId: updatedResponse.invitationId,
          projectId: updatedResponse.projectId,
          answers: updatedResponse.answers,
          audioUrl: updatedResponse.audioUrl,
          transcript: updatedResponse.transcript,
          moderationStatus: updatedResponse.moderationStatus!,
          createdAt: updatedResponse.createdAt,
          updatedAt: updatedResponse.updatedAt,
        },
      });
    } catch (err) {
      this._logger.warn('moderate-response.invalid-transition', { responseId: request.responseId, error: err });
      return ResultEx.failure(
        new ModerationNotAllowedError(request.responseId, err instanceof Error ? err.message : undefined)
      );
    }
  }
}
