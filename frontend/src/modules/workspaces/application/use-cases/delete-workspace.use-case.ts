import { inject, injectable } from 'inversify';
import ResultEx from '../../../../shared/result';
import { WorkspaceRepositoryPort } from '../ports/workspace-repository.port';
import { WorkspaceNotFoundError, WorkspaceAccessDeniedError, InvalidWorkspaceDataError } from '../../domain/errors/workspace.error';
import { TYPES } from '../../infrastructure/bootstrap/types';

export interface DeleteWorkspaceUseCaseRequest {
  workspaceId: string;
  userId: string; // for access control
  confirmText: string; // must be "confirm" for safety
}

export interface DeleteWorkspaceUseCaseResponse {
  deleted: boolean;
}

@injectable()
export class DeleteWorkspaceUseCase {
  constructor(
    @inject(TYPES.WorkspaceRepository)
    private readonly _repository: WorkspaceRepositoryPort
  ) {}

  async execute(request: DeleteWorkspaceUseCaseRequest): Promise<ResultEx<DeleteWorkspaceUseCaseResponse, Error>> {
    try {
      // Validate confirmation text
      if (request.confirmText !== 'confirm') {
        throw new InvalidWorkspaceDataError('Confirmation text must be "confirm"');
      }

      // First, get the existing workspace
      const workspace = await this._repository.findById(request.workspaceId);

      // Check access control - workspace belongs to the requesting user
      if (workspace.userId !== request.userId) {
        throw new WorkspaceAccessDeniedError(request.workspaceId, request.userId);
      }

      // Delete the workspace
      await this._repository.delete(request.workspaceId);

      return ResultEx.success({
        deleted: true,
      });
    } catch (error) {
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }
}