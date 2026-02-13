import type { ResearchCanvas } from '../../../domain/entities/research-canvas.entity';
import type { ResearchIntent } from '../../../domain/value-objects/research-intent.vo';

export interface CollectResearchDataRequest {
  readonly projectId: string;
  readonly intent: ResearchIntent;
}

export interface CollectResearchDataResponse {
  readonly canvas: ResearchCanvas;
  readonly error?: string;
}