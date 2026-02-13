import type { ResearchCanvas, SynthesisReport } from '../../../domain/entities/research-canvas.entity';

export interface GetResearchCanvasRequest {
  readonly projectId: string;
}

export interface GetResearchCanvasResponse {
  readonly canvas: ResearchCanvas;
  readonly synthesisReport?: SynthesisReport | null;
  readonly projectName?: string;
  readonly projectHypothesis?: string;
  readonly recommendedTemplate?: {
    name: string;
    slug: string;
    description: string;
  };
  readonly error?: string;
}