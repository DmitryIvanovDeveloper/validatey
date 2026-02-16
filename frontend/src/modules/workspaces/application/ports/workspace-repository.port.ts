import { Workspace } from '../../domain/entities/workspace.entity';
import { WorkspaceNotFoundError, InvalidWorkspaceDataError, WorkspaceAccessDeniedError } from '../../domain/errors/workspace.error';

export interface WorkspaceRepositoryPort {
  create(workspace: Workspace): Promise<Workspace>;
  findById(id: string): Promise<Workspace>;
  findByUserId(userId: string): Promise<Workspace[]>;
  update(workspace: Workspace): Promise<Workspace>;
  delete(id: string): Promise<void>;
}