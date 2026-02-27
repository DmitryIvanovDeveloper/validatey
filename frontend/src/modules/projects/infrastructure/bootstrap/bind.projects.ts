import { Container } from 'inversify';
import { TYPES } from './types';
import { ProjectRepositoryPort } from '../../application/ports/project-repository.port';
import type { ProjectOverviewRepositoryPort } from '../../application/ports/project-overview-repository.port';
import { MarketContextRepositoryPort } from '../../application/ports/market-context-repository.port';
import type { ProjectRiskRepositoryPort } from '../../application/ports/project-risk-repository.port';
import { ProjectRepository } from '../repositories/project.repository';
import { ProjectOverviewRepository } from '../repositories/project-overview.repository';
import { MarketContextRepository } from '../repositories/market-context.repository';
import { ProjectRiskHttpRepository } from '../repositories/project-risk.http.repository';
import { CreateProjectUseCase } from '../../application/use-cases/create-project.use-case';
import { GetProjectUseCase } from '../../application/use-cases/get-project.use-case';
import { GetPublicProjectMetaBySlugUseCase } from '../../application/use-cases/get-public-project-meta-by-slug.use-case';
import { GetProjectOverviewUseCase } from '../../application/use-cases/get-project-overview.use-case';
import { ListProjectsUseCase } from '../../application/use-cases/list-projects.use-case';
import { UpdateProjectUseCase } from '../../application/use-cases/update-project.use-case';
import { DeleteProjectUseCase } from '../../application/use-cases/delete-project.use-case';
import { AssessProjectRiskUseCase } from '../../application/use-cases/assess-project-risk.use-case';
import { GetMarketContextSuggestionUseCase } from '../../application/use-cases/get-market-context-suggestion.use-case';
import { ProjectPresenter } from '../../interface-adapters/presenters/project.presenter';
import { ProjectListPresenter } from '../../interface-adapters/presenters/project-list.presenter';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';

export function bindProjects(container: Container): void {
  // Repositories
  container.bind<ProjectRepositoryPort>(TYPES.ProjectRepository).to(ProjectRepository);
  container.bind<ProjectOverviewRepositoryPort>(TYPES.ProjectOverviewRepository).to(ProjectOverviewRepository);
  container.bind<MarketContextRepositoryPort>(TYPES.MarketContextRepository).to(MarketContextRepository);
  container.bind<ProjectRiskRepositoryPort>(TYPES.ProjectRiskRepository).to(ProjectRiskHttpRepository);

  // Use Cases
  container.bind<CreateProjectUseCase>(TYPES.CreateProjectUseCase).to(CreateProjectUseCase);
  container.bind<GetProjectUseCase>(TYPES.GetProjectUseCase).to(GetProjectUseCase);
  container.bind<GetPublicProjectMetaBySlugUseCase>(TYPES.GetPublicProjectMetaBySlugUseCase).to(GetPublicProjectMetaBySlugUseCase);
  container.bind<GetProjectOverviewUseCase>(TYPES.GetProjectOverviewUseCase).to(GetProjectOverviewUseCase);
  container.bind<ListProjectsUseCase>(TYPES.ListProjectsUseCase).to(ListProjectsUseCase);
  container.bind<UpdateProjectUseCase>(TYPES.UpdateProjectUseCase).to(UpdateProjectUseCase);
  container.bind<DeleteProjectUseCase>(TYPES.DeleteProjectUseCase).to(DeleteProjectUseCase);
  container.bind<AssessProjectRiskUseCase>(TYPES.AssessProjectRiskUseCase).to(AssessProjectRiskUseCase);
  container.bind<GetMarketContextSuggestionUseCase>(TYPES.GetMarketContextSuggestionUseCase).to(GetMarketContextSuggestionUseCase);

  // Presenters
  container.bind<ProjectPresenter>(TYPES.ProjectPresenter).to(ProjectPresenter);
  container.bind<ProjectListPresenter>(TYPES.ProjectListPresenter).to(ProjectListPresenter);
}

