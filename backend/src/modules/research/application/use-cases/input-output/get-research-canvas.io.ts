import type { ResearchCanvas } from '../../../domain/value-objects/research-canvas.vo';
import type { SynthesisReport } from '../../../domain/value-objects/synthesis-report.vo';
import type { AssumptionAssessment } from '../../../domain/value-objects/assumption-assessment.vo';

export type GetResearchCanvasRequest = {
  projectId: string;
};

export type RecommendedTemplate = {
  name: string;
  slug: string;
  description: string;
};

/** Per-assumption validation status (legacy; also derivable from assumptionAssessments). */
export type AssumptionStatus = 'confirmed' | 'need_more' | 'not_supported';

export type GetResearchCanvasResponse = {
  canvas: ResearchCanvas;
  synthesisReport?: SynthesisReport | null;
  projectName?: string;
  projectHypothesis?: string;
  recommendedTemplate?: RecommendedTemplate;
  /** One status per Key Assumption; length matches project.hypothesis.assumptions. */
  assumptionStatuses?: AssumptionStatus[] | null;
  /** Per-assumption assessment (status + evidence), keyed by assumptionId. */
  assumptionAssessments?: AssumptionAssessment[] | null;
};
