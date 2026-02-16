import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { WorkspaceRepositoryPort } from '../ports/workspace-repository.port';
import { ListWorkspacesUseCaseRequest, ListWorkspacesUseCaseResponse } from './input-output/list-workspaces.io';
import { TYPES } from '../../infrastructure/bootstrap/types';

@injectable()
export class ListWorkspacesUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(TYPES.WorkspaceRepository)
    private readonly _repository: WorkspaceRepositoryPort
  ) {}

  async execute(request: ListWorkspacesUseCaseRequest): Promise<ResultEx<ListWorkspacesUseCaseResponse, Error>> {
    this._logger.info('list-workspaces.start', { userId: request.userId });

    const findResult = await this._repository.findByUserId(request.userId);

    if (!findResult.isSuccess) {
      this._logger.error('list-workspaces.error', { error: findResult.error });
      return ResultEx.failure(findResult.error);
    }

    this._logger.info('list-workspaces.success', { userId: request.userId, count: findResult.data.length });

    return ResultEx.success({
      workspaces: findResult.data,
    });
  }
}