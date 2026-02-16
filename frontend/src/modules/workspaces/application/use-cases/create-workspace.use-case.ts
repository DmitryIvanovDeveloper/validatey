import { inject, injectable } from 'inversify';
import ResultEx from '../../../../shared/result';
import { WorkspaceEntity } from '../../domain/entities/workspace.entity';
import { InvalidWorkspaceDataError } from '../../domain/errors/workspace.error';
import { WorkspaceRepositoryPort } from '../ports/workspace-repository.port';
import { TYPES } from '../../infrastructure/bootstrap/types';

export interface CreateWorkspaceUseCaseRequest {
  userId: string;
  name: string;
}

export interface CreateWorkspaceUseCaseResponse {
  workspace: {
    id: string;
    userId: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

@injectable()
export class CreateWorkspaceUseCase {
  constructor(
    @inject(TYPES.WorkspaceRepository)
    private readonly _repository: WorkspaceRepositoryPort
  ) {}

  async execute(request: CreateWorkspaceUseCaseRequest): Promise<ResultEx<CreateWorkspaceUseCaseResponse, Error>> {
    try {
      const workspace = WorkspaceEntity.create(
        request.userId,
        request.name
      );

      const savedWorkspace = await this._repository.create(workspace.toData());

      return ResultEx.success({
        workspace: savedWorkspace,
      });
    } catch (error) {
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }
}