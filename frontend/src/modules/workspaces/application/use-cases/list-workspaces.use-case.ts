import { inject, injectable } from 'inversify';
import ResultEx from '../../../../shared/result';
import type { WorkspaceRepositoryPort } from '../ports/workspace-repository.port';
import { TYPES } from '../../infrastructure/bootstrap/types';

export interface ListWorkspacesUseCaseRequest {
  userId: string;
}

export interface ListWorkspacesUseCaseResponse {
  workspaces: {
    id: string;
    userId: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  }[];
}

@injectable()
export class ListWorkspacesUseCase {
  constructor(
    @inject(TYPES.WorkspaceRepository)
    private readonly _repository: WorkspaceRepositoryPort
  ) {}

  async execute(request: ListWorkspacesUseCaseRequest): Promise<ResultEx<ListWorkspacesUseCaseResponse, Error>> {
    try {
      const workspaces = await this._repository.findByUserId(request.userId);
      return ResultEx.success({ workspaces });
    } catch (error) {
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }
}