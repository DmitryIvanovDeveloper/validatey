/** Context for research data collection (topic + optional filters). Used by market/competitor providers. */
export type ResearchIntent = {
  readonly topic: string;
  readonly geography?: string;
  readonly segment?: string;
  readonly productDescription?: string;
  readonly budget?: 'free' | 'paid';
};

export type CollectResearchDataRequest = {
  projectId: string;
  sources?: string[];
  geography?: string;
  segment?: string;
  productDescription?: string;
};

export type CollectResearchDataResponse = {
  collected: boolean;
  marketDataCollected: boolean;
  competitorDataCollected: boolean;
};
