export type GetReportDataRequest = {
  projectId: string;
};

export type ReportViewDto = {
  verdict: string;
  verdictType: 'positive' | 'negative' | 'neutral';
  metrics: Record<string, number | string>;
  clusters: Record<string, { size: number; representativeQuote?: string; [key: string]: unknown }>;
  alternatives: string[];
  wtp: number;
  recommendations: string[];
};
