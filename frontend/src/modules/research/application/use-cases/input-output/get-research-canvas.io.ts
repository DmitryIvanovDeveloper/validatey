import type { ResearchCanvas, SynthesisReport } from '../../../domain/entities/research-canvas.entity';

export interface GetResearchCanvasRequest {
  readonly projectId: string;
}

export type ResearchStatusDto = 'idle' | 'collecting' | 'synthesizing';

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
  /** Current research phase (for "in progress" restore after reload). */
  readonly researchStatus?: ResearchStatusDto;
  readonly researchStatusUpdatedAt?: string | null;
  readonly userStories?: {
    id: string;
    role: string;
    goal: string;
    benefit: string;
    priority: 'high' | 'medium' | 'low';
    acceptanceCriteria: string[];
    functionalArea: string;
    solutionDirection?: string;
  }[];
  readonly userStoriesGeneratedAt?: Date | null;
}