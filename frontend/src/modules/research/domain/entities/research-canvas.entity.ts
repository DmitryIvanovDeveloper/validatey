export interface EarlySignal {
  readonly id: string;
  readonly type: 'positive' | 'negative' | 'neutral';
  readonly title: string;
  readonly description: string;
}

export interface ResearchCanvas {
  readonly projectId: string;
  readonly marketData: {
    size?: string;
    growth?: string;
    trends?: string[];
  };
  readonly competitorInfo: {
    competitors?: string[];
    priceRange?: string;
    rating?: string;
  };
  readonly userInsights: {
    topPains?: string[];
    wtp?: string;
    retentionHint?: string;
  };
  readonly autocompleteInsights?: {
    searchPhrases: string[];
    results: ReadonlyArray<{ phrase: string; suggestions: string[] }>;
  } | null;
  readonly earlySignals?: EarlySignal[] | null;
}

export interface SynthesisReport {
  readonly summary: string;
  readonly recommendations: string[];
}