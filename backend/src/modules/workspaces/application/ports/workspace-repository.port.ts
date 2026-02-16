import ResultEx from '../../../../infrastructure/result/result';
import { Workspace } from '../../domain/entities/workspace.entity';
import { WorkspaceNotFoundError, InvalidWorkspaceDataError, WorkspaceAccessDeniedError } from '../../domain/errors/workspace.error';

export interface WorkspaceRepositoryPort {
  create(workspace: Workspace): Promise<ResultEx<Workspace, InvalidWorkspaceDataError>>;
  findById(id: string): Promise<ResultEx<Workspace, WorkspaceNotFoundError>>;
  findByUserId(userId: string): Promise<ResultEx<Workspace[], Error>>;
  update(workspace: Workspace): Promise<ResultEx<Workspace, WorkspaceNotFoundError | InvalidWorkspaceDataError>>;
  delete(id: string): Promise<ResultEx<void, WorkspaceNotFoundError>>;
}