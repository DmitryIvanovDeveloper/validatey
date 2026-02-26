import { inject, injectable } from 'inversify';
import ResultEx from '../../../../shared/result';
import type { WorkspaceRepositoryPort } from '../ports/workspace-repository.port';
import { WorkspaceNotFoundError, WorkspaceAccessDeniedError } from '../../domain/errors/workspace.error';
import { TYPES } from '../../infrastructure/bootstrap/types';

export interface GetWorkspaceUseCaseRequest {
  workspaceId: string;
  userId: string; // for access control
}

export interface GetWorkspaceUseCaseResponse {
  workspace: {
    id: string;
    userId: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

@injectable()
export class GetWorkspaceUseCase {
  constructor(
    @inject(TYPES.WorkspaceRepository)
    private readonly _repository: WorkspaceRepositoryPort
  ) {}

  async execute(request: GetWorkspaceUseCaseRequest): Promise<ResultEx<GetWorkspaceUseCaseResponse, Error>> {
    try {
      const workspace = await this._repository.findById(request.workspaceId);

      // Check access control - workspace belongs to the requesting user
      if (workspace.userId !== request.userId) {
        throw new WorkspaceAccessDeniedError(request.workspaceId, request.userId);
      }

      return ResultEx.success({
        workspace,
      });
    } catch (error) {
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }
}