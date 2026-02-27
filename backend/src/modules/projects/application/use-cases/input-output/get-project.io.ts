import { Project } from '../../../domain/entities/project.entity';

export type GetProjectUseCaseRequest = {
  projectId: string;
  /** Required when not using guest access. */
  userId?: string;
  /** When set, access is granted by public slug (guest view); userId is ignored. */
  guestSlug?: string;
};

export type GetProjectUseCaseResponse = {
  project: Project;
};



