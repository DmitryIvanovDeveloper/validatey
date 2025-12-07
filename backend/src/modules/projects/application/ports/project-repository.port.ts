import ResultEx from '../../../../infrastructure/result/result';
import { Project } from '../../domain/entities/project.entity';
import { ProjectNotFoundError, InvalidProjectDataError } from '../../domain/errors/project.error';

export interface ProjectRepositoryPort {
  create(project: Project): Promise<ResultEx<Project, InvalidProjectDataError>>;
  findById(id: string): Promise<ResultEx<Project, ProjectNotFoundError>>;
  findByUserId(userId: string): Promise<ResultEx<Project[], Error>>;
  update(project: Project): Promise<ResultEx<Project, ProjectNotFoundError | InvalidProjectDataError>>;
  delete(id: string): Promise<ResultEx<void, ProjectNotFoundError>>;
}


