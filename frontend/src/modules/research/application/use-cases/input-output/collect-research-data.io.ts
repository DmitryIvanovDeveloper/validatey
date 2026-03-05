import type { ResearchCanvas } from '../../../domain/entities/research-canvas.entity';
import type { ResearchIntent } from '../../../domain/value-objects/research-intent.vo';

export interface CollectResearchDataRequest {
  readonly projectId: string;
  readonly intent: ResearchIntent;
}

export type CooldownErrorDetails = {
  readonly type: 'COOLDOWN';
  readonly nextAvailableAt: string;
  readonly timeUntilNext: number;
  readonly formattedTimeRemaining: string;
};

export interface CollectResearchDataResponse {
  readonly canvas: ResearchCanvas;
  readonly error?: string | CooldownErrorDetails;
}