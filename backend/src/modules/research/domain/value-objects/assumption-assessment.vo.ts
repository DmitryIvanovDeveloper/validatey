export type AssumptionStatus = 'confirmed' | 'need_more' | 'not_supported';

/** Per-assumption validation result (status + evidence). */
export interface AssumptionAssessment {
  readonly assumptionId: string;
  readonly status: AssumptionStatus;
  readonly evidence: string | null;
}
