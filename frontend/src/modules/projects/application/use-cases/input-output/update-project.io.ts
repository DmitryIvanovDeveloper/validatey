import { Segment } from '../../../domain/value-objects/segment.vo';
import { Hypothesis } from '../../../domain/value-objects/hypothesis.vo';
import { ProjectStatus, MarketContext } from '../../../domain/entities/project.entity';

export type UpdateProjectUseCaseRequest = {
  projectId: string;
  updates: {
    name?: string;
    segment?: Segment;
    hypothesis?: Hypothesis;
    marketContext?: MarketContext | null;
    status?: ProjectStatus;
  };
};

export type UpdateProjectUseCaseResponse = {
  project: {
    id: string;
    name: string;
    segment: {
      description: string;
      demographics: Record<string, any>;
    } | null;
    hypothesis: {
      description: string;
      assumptions: string[];
    } | null;
    marketContext: MarketContext | null;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
};



