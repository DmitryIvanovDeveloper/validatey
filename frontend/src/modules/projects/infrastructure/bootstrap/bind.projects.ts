import { Container } from 'inversify';
import { TYPES } from './types';
import { ProjectRepositoryPort } from '../../application/ports/project-repository.port';
import { ProjectRepository } from '../repositories/project.repository';
import { CreateProjectUseCase } from '../../application/use-cases/create-project.use-case';
import { GetProjectUseCase } from '../../application/use-cases/get-project.use-case';
import { ListProjectsUseCase } from '../../application/use-cases/list-projects.use-case';
import { UpdateProjectUseCase } from '../../application/use-cases/update-project.use-case';
import { DeleteProjectUseCase } from '../../application/use-cases/delete-project.use-case';
import { ProjectPresenter } from '../../interface-adapters/presenters/project.presenter';
import { ProjectListPresenter } from '../../interface-adapters/presenters/project-list.presenter';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';

export function bindProjects(container: Container): void {
  // Repository
  container.bind<ProjectRepositoryPort>(TYPES.ProjectRepository).to(ProjectRepository);

  // Use Cases
  container.bind<CreateProjectUseCase>(TYPES.CreateProjectUseCase).to(CreateProjectUseCase);
  container.bind<GetProjectUseCase>(TYPES.GetProjectUseCase).to(GetProjectUseCase);
  container.bind<ListProjectsUseCase>(TYPES.ListProjectsUseCase).to(ListProjectsUseCase);
  container.bind<UpdateProjectUseCase>(TYPES.UpdateProjectUseCase).to(UpdateProjectUseCase);
  container.bind<DeleteProjectUseCase>(TYPES.DeleteProjectUseCase).to(DeleteProjectUseCase);

  // Presenters
  container.bind<ProjectPresenter>(TYPES.ProjectPresenter).to(ProjectPresenter);
  container.bind<ProjectListPresenter>(TYPES.ProjectListPresenter).to(ProjectListPresenter);
}

