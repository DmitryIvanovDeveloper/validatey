export type CalculateMetricsUseCaseRequest = {
  projectId: string;
};

export type CalculateMetricsUseCaseResponse = {
  metrics: {
    problemSeverity: {
      average: number;
      median: number;
      highScoresCount: number;
      criticalScoresCount: number;
    };
    wtp: {
      median: number;
      mean: number;
      percentile25: number;
      percentile75: number;
      confidenceInterval?: {
        lower: number;
        upper: number;
      };
    };
    clusters: Array<{
      id: string;
      theme: string;
      representativeQuote: string;
      size: number;
    }>;
  };
};


