export type AssumptionStatus = 'confirmed' | 'need_more' | 'not_supported' | 'not_testable' | 'disproven';

/** Per-assumption validation result (status + evidence). */
export interface AssumptionAssessment {
  readonly assumptionId: string;
  readonly status: AssumptionStatus;
  readonly evidence: string | null;
}
