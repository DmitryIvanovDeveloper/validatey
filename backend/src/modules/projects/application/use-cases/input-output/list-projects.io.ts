import { Project } from '../../../domain/entities/project.entity';

export type ListProjectsUseCaseRequest = {
  userId: string;
  /** In development only: return all projects (ignores userId). */
  listAll?: boolean;
};

export type ListProjectsUseCaseResponse = {
  projects: Project[];
};



