import { Segment, Hypothesis, MarketContext } from '../../../domain/entities/project.entity';

export type CreateProjectUseCaseRequest = {
  userId: string;
  name: string;
  segment?: Segment;
  hypothesis?: Hypothesis;
  marketContext?: MarketContext;
  targetAudience?: string;
  cost?: number;
};

export type CreateProjectUseCaseResponse = {
  project: {
    id: string;
    userId: string;
    name: string;
    status: 'draft' | 'active' | 'completed' | 'archived';
    segment: Segment | null;
    hypothesis: Hypothesis | null;
    marketContext: MarketContext | null;
    targetAudience: string | null;
    cost: number | null;
    createdAt: Date;
    updatedAt: Date;
  };
};

