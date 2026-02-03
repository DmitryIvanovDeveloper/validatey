import { ScenarioMetadata } from '../../../domain/entities/scenario.entity';
import { Segment, Hypothesis, MarketContextForScenario } from '../../../application/ports/llm-service.port';

export type GenerateScenarioUseCaseRequest = {
  projectId: string;
  userId: string; // Required for project ownership validation
  segment?: Segment | null;
  hypothesis?: Hypothesis | null;
  marketContext?: MarketContextForScenario | null;
  metadata?: {
    tone?: string;
    length?: number;
  };
  prompt?: string; // Optional prompt override
};

export type GenerateScenarioUseCaseResponse = {
  scenario: {
    id: string;
    projectId: string;
    version: number;
    content: string;
    status: 'draft' | 'generated' | 'approved' | 'rejected'; // Computed from isGenerated/isEdited
    isGenerated: boolean;
    isEdited: boolean;
    metadata: ScenarioMetadata | null;
    createdAt: Date; // Will be serialized to ISO 8601 in routes
    updatedAt: Date; // Will be serialized to ISO 8601 in routes
  };
};

