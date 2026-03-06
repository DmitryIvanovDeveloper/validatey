import ResultEx from '../../../../infrastructure/result/result';
import { Project } from '../../domain/entities/project.entity';
import { ProjectNotFoundError, InvalidProjectDataError } from '../../domain/errors/project.error';

export interface ProjectRepositoryPort {
  create(project: Project): Promise<ResultEx<Project, InvalidProjectDataError>>;
  findById(id: string): Promise<ResultEx<Project, ProjectNotFoundError>>;
  /** Resolve project by public survey slug (for /survey/public/:slug). */
  findByPublicSlug(slug: string): Promise<ResultEx<Project, ProjectNotFoundError>>;
  /** Generate a unique short slug for public link (e.g. when enabling public access). */
  generateUniquePublicSlug(): Promise<ResultEx<string, Error>>;
  findByUserId(userId: string): Promise<ResultEx<Project[], Error>>;
  /** Find projects by workspace ID (for workspace-based access). */
  findByWorkspaceId(workspaceId: string): Promise<ResultEx<Project[], Error>>;
  findAll(): Promise<ResultEx<Project[], Error>>;
  /** Check if user has access to project (for authorization). */
  userHasAccessToProject(projectId: string, userId: string): Promise<ResultEx<boolean, Error>>;
  update(project: Project): Promise<ResultEx<Project, ProjectNotFoundError | InvalidProjectDataError>>;
  delete(id: string): Promise<ResultEx<void, ProjectNotFoundError>>;
  /** Reassign all projects from one user id to another (e.g. after Google login). Returns count updated. */
  reassignUserId(fromUserId: string, toUserId: string): Promise<ResultEx<number, Error>>;
}



