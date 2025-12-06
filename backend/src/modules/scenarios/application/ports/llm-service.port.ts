import ResultEx from '../../../../infrastructure/result/result';
import { ScenarioGenerationError } from '../../domain/errors/scenario.error';
import { ScenarioMetadata } from '../../domain/entities/scenario.entity';

// Segment and Hypothesis types (matching frontend requirements)
export interface Segment {
  readonly description: string;
  readonly demographics: Record<string, any>;
}

export interface Hypothesis {
  readonly description: string;
  readonly assumptions: string[];
}

export interface GenerateScenarioRequest {
  projectId: string;
  segment?: Segment | null;
  hypothesis?: Hypothesis | null;
  metadata?: {
    tone?: string;
    length?: number;
  };
  prompt?: string; // Optional custom prompt override
}

export interface GenerateScenarioResponse {
  content: string;
  metadata: ScenarioMetadata;
}

export interface LLMServicePort {
  generateScenario(request: GenerateScenarioRequest): Promise<ResultEx<GenerateScenarioResponse, ScenarioGenerationError>>;
}

