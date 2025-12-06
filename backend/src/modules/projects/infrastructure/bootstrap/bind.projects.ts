import { Container } from 'inversify';
import { TYPES } from './types';
import { ProjectRepositoryPort } from '../../application/ports/project-repository.port';
import { SupabaseProjectRepository } from '../repositories/supabase-project.repository';
import { CreateProjectUseCase } from '../../application/use-cases/create-project.use-case';
import { GetProjectUseCase } from '../../application/use-cases/get-project.use-case';
import { UpdateProjectUseCase } from '../../application/use-cases/update-project.use-case';
import { ListProjectsUseCase } from '../../application/use-cases/list-projects.use-case';
import { ProjectPresenter } from '../../interface-adapters/presenters/project.presenter';

export function bindProjects(container: Container): void {
  // Repository
  container.bind<ProjectRepositoryPort>(TYPES.ProjectRepository).to(SupabaseProjectRepository);

  // Use Cases
  container.bind<CreateProjectUseCase>(TYPES.CreateProjectUseCase).to(CreateProjectUseCase);
  container.bind<GetProjectUseCase>(TYPES.GetProjectUseCase).to(GetProjectUseCase);
  container.bind<UpdateProjectUseCase>(TYPES.UpdateProjectUseCase).to(UpdateProjectUseCase);
  container.bind<ListProjectsUseCase>(TYPES.ListProjectsUseCase).to(ListProjectsUseCase);

  // Presenter
  container.bind<ProjectPresenter>(TYPES.ProjectPresenter).to(ProjectPresenter);
}

