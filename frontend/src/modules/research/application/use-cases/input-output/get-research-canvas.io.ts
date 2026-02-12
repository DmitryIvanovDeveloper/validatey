import type { ResearchCanvas } from '../../../domain/entities/research-canvas.entity';

export interface GetResearchCanvasRequest {
  readonly projectId: string;
}

export interface GetResearchCanvasResponse {
  readonly canvas: ResearchCanvas;
  readonly projectName?: string;
  readonly recommendedTemplate?: {
    name: string;
    slug: string;
    description: string;
  };
}