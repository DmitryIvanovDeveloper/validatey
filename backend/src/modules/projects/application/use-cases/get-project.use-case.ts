import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { ProjectNotFoundError, ProjectAccessDeniedError } from '../../domain/errors/project.error';
import { ProjectRepositoryPort } from '../ports/project-repository.port';
import { GetProjectUseCaseRequest, GetProjectUseCaseResponse } from './input-output/get-project.io';
import { TYPES } from '../../infrastructure/bootstrap/types';

@injectable()
export class GetProjectUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(TYPES.ProjectRepository)
    private readonly _repository: ProjectRepositoryPort
  ) {}

  async execute(
    request: GetProjectUseCaseRequest
  ): Promise<ResultEx<GetProjectUseCaseResponse, ProjectNotFoundError | ProjectAccessDeniedError>> {
    this._logger.info('get-project.start', { projectId: request.projectId, userId: request.userId });

    const findResult = await this._repository.findById(request.projectId);

    if (!findResult.isSuccess) {
      this._logger.error('get-project.not-found', { projectId: request.projectId });
      return ResultEx.failure(findResult.error);
    }

    const project = findResult.data;

    const accessResult = await this._repository.userHasAccessToProject(request.projectId, request.userId);
    if (!accessResult.isSuccess) {
      return ResultEx.failure(accessResult.error);
    }
    if (!accessResult.data) {
      this._logger.warn('get-project.access-denied', { projectId: request.projectId, userId: request.userId });
      return ResultEx.failure(new ProjectAccessDeniedError(request.projectId, request.userId));
    }

    this._logger.info('get-project.success', { projectId: project.id });

    return ResultEx.success({
      project,
    });
  }
}



