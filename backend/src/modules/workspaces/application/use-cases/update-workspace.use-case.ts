import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { WorkspaceEntity } from '../../domain/entities/workspace.entity';
import { WorkspaceRepositoryPort } from '../ports/workspace-repository.port';
import { WorkspaceNotFoundError, WorkspaceAccessDeniedError, InvalidWorkspaceDataError } from '../../domain/errors/workspace.error';
import { UpdateWorkspaceUseCaseRequest, UpdateWorkspaceUseCaseResponse } from './input-output/update-workspace.io';
import { TYPES } from '../../infrastructure/bootstrap/types';

@injectable()
export class UpdateWorkspaceUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(TYPES.WorkspaceRepository)
    private readonly _repository: WorkspaceRepositoryPort
  ) {}

  async execute(request: UpdateWorkspaceUseCaseRequest): Promise<ResultEx<UpdateWorkspaceUseCaseResponse, WorkspaceNotFoundError | WorkspaceAccessDeniedError | InvalidWorkspaceDataError>> {
    this._logger.info('update-workspace.start', {
      workspaceId: request.workspaceId,
      userId: request.userId,
      name: request.name
    });

    // First, get the existing workspace
    const findResult = await this._repository.findById(request.workspaceId);

    if (!findResult.isSuccess) {
      this._logger.error('update-workspace.not-found', { workspaceId: request.workspaceId, error: findResult.error });
      return ResultEx.failure(findResult.error);
    }

    // Check access control - workspace belongs to the requesting user
    if (findResult.data.userId !== request.userId) {
      this._logger.warn('update-workspace.access-denied', {
        workspaceId: request.workspaceId,
        userId: request.userId,
        workspaceOwnerId: findResult.data.userId
      });
      return ResultEx.failure(new WorkspaceAccessDeniedError(request.workspaceId, request.userId));
    }

    try {
      // Update the workspace
      let workspace = WorkspaceEntity.fromData(findResult.data).withName(request.name);
      if (request.iconUrl !== undefined) {
        workspace = workspace.withIconUrl(request.iconUrl ?? null);
      }

      const updateResult = await this._repository.update(workspace.toData());

      if (!updateResult.isSuccess) {
        this._logger.error('update-workspace.repository-error', { error: updateResult.error });
        return ResultEx.failure(updateResult.error);
      }

      this._logger.info('update-workspace.success', { workspaceId: request.workspaceId });

      return ResultEx.success({
        workspace: updateResult.data,
      });
    } catch (error) {
      this._logger.error('update-workspace.error', { error });
      if (error instanceof InvalidWorkspaceDataError) {
        return ResultEx.failure(error);
      }
      return ResultEx.failure(new InvalidWorkspaceDataError(error instanceof Error ? error.message : 'Unknown error'));
    }
  }
}