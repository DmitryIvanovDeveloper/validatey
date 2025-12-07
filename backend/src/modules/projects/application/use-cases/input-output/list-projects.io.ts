import { Project } from '../../../domain/entities/project.entity';

export type ListProjectsUseCaseRequest = {
  userId: string;
};

export type ListProjectsUseCaseResponse = {
  projects: Project[];
};


