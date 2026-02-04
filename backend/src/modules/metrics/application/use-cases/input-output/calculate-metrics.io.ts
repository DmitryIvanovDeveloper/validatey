export type CalculateMetricsUseCaseRequest = {
  projectId: string;
  /** Template slug: wtp | feature-demand | value-prop. Drives which metrics are required and returned. */
  templateSlug?: string | null;
};

export type CalculateMetricsUseCaseResponse = {
  metrics: {
    problemSeverity?: {
      average: number;
      median: number;
      highScoresCount: number;
      criticalScoresCount: number;
    };
    wtp?: {
      median: number;
      mean: number;
      percentile25: number;
      percentile75: number;
      confidenceInterval?: {
        lower: number;
        upper: number;
      };
    };
    /** For template feature-demand: average importance score. */
    featureScore?: { average: number; median: number; responseCount: number };
    /** For template value-prop: average value-match score. */
    valueMatchScore?: { average: number; median: number; responseCount: number };
    clusters: Array<{
      id: string;
      theme: string;
      representativeQuote: string;
      size: number;
    }>;
  };
};



