import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { WorkspaceRepositoryPort } from '../ports/workspace-repository.port';
import { WorkspaceNotFoundError, WorkspaceAccessDeniedError } from '../../domain/errors/workspace.error';
import { GetWorkspaceUseCaseRequest, GetWorkspaceUseCaseResponse } from './input-output/get-workspace.io';
import { TYPES } from '../../infrastructure/bootstrap/types';

@injectable()
export class GetWorkspaceUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(TYPES.WorkspaceRepository)
    private readonly _repository: WorkspaceRepositoryPort
  ) {}

  async execute(request: GetWorkspaceUseCaseRequest): Promise<ResultEx<GetWorkspaceUseCaseResponse, WorkspaceNotFoundError | WorkspaceAccessDeniedError>> {
    this._logger.info('get-workspace.start', { workspaceId: request.workspaceId, userId: request.userId });

    const findResult = await this._repository.findById(request.workspaceId);

    if (!findResult.isSuccess) {
      this._logger.error('get-workspace.not-found', { workspaceId: request.workspaceId, error: findResult.error });
      return ResultEx.failure(findResult.error);
    }

    // Check access control - workspace belongs to the requesting user
    if (findResult.data.userId !== request.userId) {
      this._logger.warn('get-workspace.access-denied', {
        workspaceId: request.workspaceId,
        userId: request.userId,
        workspaceOwnerId: findResult.data.userId
      });
      return ResultEx.failure(new WorkspaceAccessDeniedError(request.workspaceId, request.userId));
    }

    this._logger.info('get-workspace.success', { workspaceId: request.workspaceId });

    return ResultEx.success({
      workspace: findResult.data,
    });
  }
}