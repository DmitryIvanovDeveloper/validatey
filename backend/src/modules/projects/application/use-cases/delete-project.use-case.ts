import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { ProjectNotFoundError, ProjectAccessDeniedError } from '../../domain/errors/project.error';
import { ProjectRepositoryPort } from '../ports/project-repository.port';
import { DeleteProjectUseCaseRequest, DeleteProjectUseCaseResponse } from './input-output/delete-project.io';
import { TYPES } from '../../infrastructure/bootstrap/types';

@injectable()
export class DeleteProjectUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(TYPES.ProjectRepository)
    private readonly _repository: ProjectRepositoryPort
  ) {}

  async execute(
    request: DeleteProjectUseCaseRequest
  ): Promise<ResultEx<DeleteProjectUseCaseResponse, ProjectNotFoundError | ProjectAccessDeniedError>> {
    this._logger.info('delete-project.start', { projectId: request.projectId, userId: request.userId });

    const findResult = await this._repository.findById(request.projectId);

    if (!findResult.isSuccess) {
      this._logger.error('delete-project.not-found', { projectId: request.projectId });
      return ResultEx.failure(findResult.error);
    }

    const project = findResult.data;

    if (project.userId !== request.userId) {
      this._logger.warn('delete-project.access-denied', { projectId: request.projectId, userId: request.userId });
      return ResultEx.failure(new ProjectAccessDeniedError(request.projectId, request.userId));
    }

    const deleteResult = await this._repository.delete(request.projectId);

    if (!deleteResult.isSuccess) {
      this._logger.error('delete-project.delete-failed', { projectId: request.projectId });
      return ResultEx.failure(deleteResult.error);
    }

    this._logger.info('delete-project.success', { projectId: request.projectId });

    return ResultEx.success(undefined);
  }
}
