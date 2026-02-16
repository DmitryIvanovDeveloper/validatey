import { Container } from 'inversify';

// Repository
import { WorkspaceRepository } from '../repositories/workspace.repository';
import { WorkspaceRepositoryPort } from '../../application/ports/workspace-repository.port';

// Presenters
import { WorkspaceListPresenter } from '../../interface-adapters/presenters/workspace-list.presenter';

// Use Cases
import { CreateWorkspaceUseCase } from '../../application/use-cases/create-workspace.use-case';
import { ListWorkspacesUseCase } from '../../application/use-cases/list-workspaces.use-case';
import { GetWorkspaceUseCase } from '../../application/use-cases/get-workspace.use-case';
import { UpdateWorkspaceUseCase } from '../../application/use-cases/update-workspace.use-case';
import { DeleteWorkspaceUseCase } from '../../application/use-cases/delete-workspace.use-case';

// Types
import { TYPES } from './types';

export function bindWorkspaces(container: Container): void {
  // Repository
  container
    .bind<WorkspaceRepositoryPort>(TYPES.WorkspaceRepository)
    .to(WorkspaceRepository)
    .inSingletonScope();

  // Presenters
  container
    .bind<WorkspaceListPresenter>(TYPES.WorkspaceListPresenter)
    .to(WorkspaceListPresenter)
    .inSingletonScope();

  // Use Cases
  container
    .bind<CreateWorkspaceUseCase>(TYPES.CreateWorkspaceUseCase)
    .to(CreateWorkspaceUseCase)
    .inSingletonScope();

  container
    .bind<ListWorkspacesUseCase>(TYPES.ListWorkspacesUseCase)
    .to(ListWorkspacesUseCase)
    .inSingletonScope();

  container
    .bind<GetWorkspaceUseCase>(TYPES.GetWorkspaceUseCase)
    .to(GetWorkspaceUseCase)
    .inSingletonScope();

  container
    .bind<UpdateWorkspaceUseCase>(TYPES.UpdateWorkspaceUseCase)
    .to(UpdateWorkspaceUseCase)
    .inSingletonScope();

  container
    .bind<DeleteWorkspaceUseCase>(TYPES.DeleteWorkspaceUseCase)
    .to(DeleteWorkspaceUseCase)
    .inSingletonScope();
}