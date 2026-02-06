import type { ResearchCanvas } from '../../../domain/value-objects/research-canvas.vo';

export type GetResearchCanvasRequest = {
  projectId: string;
};

export type RecommendedTemplate = {
  name: string;
  slug: string;
  description: string;
};

export type GetResearchCanvasResponse = {
  canvas: ResearchCanvas;
  projectName?: string;
  recommendedTemplate?: RecommendedTemplate;
};
