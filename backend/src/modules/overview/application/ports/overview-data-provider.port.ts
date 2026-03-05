import ResultEx from '../../../../infrastructure/result/result';

type InvitationStatus = 'pending' | 'sent' | 'opened' | 'completed' | 'responded' | 'expired';

/** Minimal synthesis report shape for overview (from research storage). */
export interface OverviewSynthesisReport {
  readonly summary: string;
  readonly recommendations: readonly string[];
  readonly verdict: string;
}

/** Minimal assumption assessment for overview (from research storage). */
export interface OverviewAssumptionAssessment {
  readonly assumptionId: string;
  readonly status: string;
  readonly evidence: string | null;
}

/** Raw data assembled from multiple sources for Overview use case (infrastructure implements this). */
export interface OverviewRawData {
  project: {
    id: string;
    name: string;
    status: string;
    deadline: Date | null;
    createdAt: Date;
    segment: { description?: string } | null;
    hypothesis: { description?: string; assumptions?: ReadonlyArray<{ id: string; text: string }> } | null;
    scenarioTemplateSlug: string | null;
  };
  invitations: Array<{ status: InvitationStatus }>;
  earlySignals: Array<{ type: string; title: string; description: string }>;
  researchSummary: string | null;
  researchMarketSnippet: string | null;
  researchCompetitorsSnippet: string | null;
  synthesisVerdict: 'validated' | 'rejected' | 'needs-more-data' | null;
  /** Full synthesis report for Key Assumptions / Executive Summary. */
  synthesisReport?: OverviewSynthesisReport | null;
  /** Per-assumption assessments (status + evidence) for Key Assumptions. */
  assumptionAssessments?: OverviewAssumptionAssessment[] | null;
  rounds: Array<{
    id: string;
    title: string;
    type: string;
    status: string;
    results: { keyFinding?: string } | null;
  }>;
  responses: Array<{ createdAt: Date; answers: Record<string, unknown> }>;
  metricsData: {
    quotes: Array<{ text: string }>;
    wtpValues: number[];
    problemSeverityScores: number[];
  } | null;
  /** Number of waitlist/landing signups for this project (optional, from wishlist module). */
  waitlistSubscribersCount?: number;
}

export interface OverviewDataProviderPort {
  getData(projectId: string): Promise<ResultEx<OverviewRawData, Error>>;
}
