import { ProjectStatus, Segment, Hypothesis } from '../../../domain/entities/project.entity';

export type UpdateProjectUseCaseRequest = {
  projectId: string;
  userId: string;
  name?: string;
  status?: ProjectStatus;
  segment?: Segment;
  hypothesis?: Hypothesis;
  targetAudience?: string;
  cost?: number;
};

export type UpdateProjectUseCaseResponse = {
  project: {
    id: string;
    userId: string;
    name: string;
    status: ProjectStatus;
    segment: Segment | null;
    hypothesis: Hypothesis | null;
    targetAudience: string | null;
    cost: number | null;
    createdAt: Date;
    updatedAt: Date;
  };
};

