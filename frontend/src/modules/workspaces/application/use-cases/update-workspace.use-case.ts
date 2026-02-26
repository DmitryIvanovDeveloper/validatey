import { inject, injectable } from 'inversify';
import ResultEx from '../../../../shared/result';
import { WorkspaceEntity } from '../../domain/entities/workspace.entity';
import type { WorkspaceRepositoryPort } from '../ports/workspace-repository.port';
import { WorkspaceNotFoundError, WorkspaceAccessDeniedError, InvalidWorkspaceDataError } from '../../domain/errors/workspace.error';
import { TYPES } from '../../infrastructure/bootstrap/types';

export interface UpdateWorkspaceUseCaseRequest {
  workspaceId: string;
  userId: string; // for access control
  name: string;
  iconUrl?: string | null;
}

export interface UpdateWorkspaceUseCaseResponse {
  workspace: {
    id: string;
    userId: string;
    name: string;
    iconUrl?: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
}

@injectable()
export class UpdateWorkspaceUseCase {
  constructor(
    @inject(TYPES.WorkspaceRepository)
    private readonly _repository: WorkspaceRepositoryPort
  ) {}

  async execute(request: UpdateWorkspaceUseCaseRequest): Promise<ResultEx<UpdateWorkspaceUseCaseResponse, Error>> {
    try {
      // First, get the existing workspace
      const existingWorkspace = await this._repository.findById(request.workspaceId);

      // Check access control - workspace belongs to the requesting user
      if (existingWorkspace.userId !== request.userId) {
        throw new WorkspaceAccessDeniedError(request.workspaceId, request.userId);
      }

      // Update the workspace
      let workspace = WorkspaceEntity.fromData(existingWorkspace).withName(request.name);
      if (request.iconUrl !== undefined) {
        workspace = workspace.withIconUrl(request.iconUrl ?? null);
      }

      const savedWorkspace = await this._repository.update(workspace.toData());

      return ResultEx.success({
        workspace: savedWorkspace,
      });
    } catch (error) {
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }
}