import type { ResearchCanvas } from '../../../domain/value-objects/research-canvas.vo';
import type { SynthesisReport } from '../../../domain/value-objects/synthesis-report.vo';

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
  synthesisReport?: SynthesisReport | null;
  projectName?: string;
  projectHypothesis?: string;
  recommendedTemplate?: RecommendedTemplate;
};
