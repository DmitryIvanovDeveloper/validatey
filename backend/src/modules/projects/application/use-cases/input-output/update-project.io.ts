import { ProjectStatus, Segment, Hypothesis, MarketContext } from '../../../domain/entities/project.entity';

export type UpdateProjectUseCaseRequest = {
  projectId: string;
  userId: string;
  name?: string;
  status?: ProjectStatus;
  segment?: Segment;
  hypothesis?: Hypothesis;
  marketContext?: MarketContext;
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
    marketContext: MarketContext | null;
    targetAudience: string | null;
    cost: number | null;
    createdAt: Date;
    updatedAt: Date;
  };
};



