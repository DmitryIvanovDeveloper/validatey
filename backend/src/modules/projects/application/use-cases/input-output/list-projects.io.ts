import { Project } from '../../../domain/entities/project.entity';

export type ListProjectsUseCaseRequest = {
  userId: string;
  /** In development only: return all projects (ignores userId). */
  listAll?: boolean;
  /** Filter projects by workspace ID. */
  workspaceId?: string;
};

export type ListProjectsUseCaseResponse = {
  projects: Project[];
};



