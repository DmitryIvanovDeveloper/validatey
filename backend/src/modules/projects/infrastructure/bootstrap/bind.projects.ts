import { Container } from 'inversify';
import { TYPES } from './types';
import { ProjectRepositoryPort } from '../../application/ports/project-repository.port';
import type { ProjectRiskAssessorPort } from '../../application/ports/project-risk-assessor.port';
import type { SurveyPlatformsLlmPort } from '../../application/ports/survey-platforms-llm.port';
import { SupabaseProjectRepository } from '../repositories/supabase-project.repository';
import { CreateProjectUseCase } from '../../application/use-cases/create-project.use-case';
import { GetProjectUseCase } from '../../application/use-cases/get-project.use-case';
import { UpdateProjectUseCase } from '../../application/use-cases/update-project.use-case';
import { ListProjectsUseCase } from '../../application/use-cases/list-projects.use-case';
import { DeleteProjectUseCase } from '../../application/use-cases/delete-project.use-case';
import { AssessProjectRiskUseCase } from '../../application/use-cases/assess-project-risk.use-case';
import { RulesBasedProjectRiskAssessorAdapter } from '../services/rules-based-project-risk-assessor.adapter';
import { ProjectController } from '../../interface-adapters/controllers/project.controller';

export function bindProjects(container: Container): void {
  // Repository
  container.bind<ProjectRepositoryPort>(TYPES.ProjectRepository).to(SupabaseProjectRepository);

  // Use Cases
  container.bind<CreateProjectUseCase>(TYPES.CreateProjectUseCase).to(CreateProjectUseCase);
  container.bind<GetProjectUseCase>(TYPES.GetProjectUseCase).to(GetProjectUseCase);
  container.bind<UpdateProjectUseCase>(TYPES.UpdateProjectUseCase).to(UpdateProjectUseCase);
  container.bind<ListProjectsUseCase>(TYPES.ListProjectsUseCase).to(ListProjectsUseCase);
  container.bind<DeleteProjectUseCase>(TYPES.DeleteProjectUseCase).to(DeleteProjectUseCase);
  container.bind<AssessProjectRiskUseCase>(TYPES.AssessProjectRiskUseCase).to(AssessProjectRiskUseCase);

  // Infrastructure services
  container.bind<ProjectRiskAssessorPort>(TYPES.ProjectRiskAssessor).to(RulesBasedProjectRiskAssessorAdapter);

  // Controller
  container.bind<ProjectController>(TYPES.ProjectController).to(ProjectController);
}

