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
  readonly assumptionStatuses?: ('confirmed' | 'need_more' | 'not_supported')[] | null;
  readonly assumptionAssessments?: Array<{ assumptionId: string; status: string; evidence: string | null }> | null;
  readonly error?: string;
}