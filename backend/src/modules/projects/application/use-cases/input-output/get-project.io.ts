import { Project } from '../../../domain/entities/project.entity';

export type GetProjectUseCaseRequest = {
  projectId: string;
  userId: string;
};

export type GetProjectUseCaseResponse = {
  project: Project;
};



