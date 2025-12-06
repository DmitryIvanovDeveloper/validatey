import { Segment } from '../../../domain/value-objects/segment.vo';
import { Hypothesis } from '../../../domain/value-objects/hypothesis.vo';

export type UpdateProjectUseCaseRequest = {
  projectId: string;
  updates: {
    name?: string;
    segment?: Segment;
    hypothesis?: Hypothesis;
    status?: string;
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
    status: string;
    createdAt: string;
    updatedAt: string;
  };
};

