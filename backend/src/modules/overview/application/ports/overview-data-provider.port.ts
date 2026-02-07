import ResultEx from '../../../../infrastructure/result/result';

type InvitationStatus = 'pending' | 'sent' | 'opened' | 'completed' | 'responded' | 'expired';

/** Raw data assembled from multiple sources for Overview use case (infrastructure implements this). */
export interface OverviewRawData {
  project: {
    id: string;
    name: string;
    status: string;
    deadline: Date | null;
    createdAt: Date;
    segment: { description?: string } | null;
    hypothesis: { description?: string } | null;
    scenarioTemplateSlug: string | null;
  };
  invitations: Array<{ status: InvitationStatus }>;
  earlySignals: Array<{ type: string; title: string; description: string }>;
  researchSummary: string | null;
  researchMarketSnippet: string | null;
  researchCompetitorsSnippet: string | null;
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
}

export interface OverviewDataProviderPort {
  getData(projectId: string): Promise<ResultEx<OverviewRawData, Error>>;
}
