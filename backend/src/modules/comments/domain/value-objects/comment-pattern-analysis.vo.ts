export type PatternType = 'myth' | 'failure' | 'advice' | 'validation' | 'feature_request' | 'comparison' | 'workaround';

export interface CommentPatternExample {
  readonly content: string;
  readonly author: string;
  readonly source: string;
  readonly url?: string; // Link to original comment for attribution
}

export interface CommentPattern {
  readonly type: PatternType;
  readonly label: string;
  readonly insight: string;
  readonly count: number;
  readonly percentage: number;
  readonly sentimentScore: number; // -1 (very negative) to +1 (very positive), 0 = neutral
  readonly confidenceScore: number; // 0-1: AI confidence in this pattern analysis
  readonly recencyScore: number; // 0-1: how recent this pattern is (1 = very recent)
  readonly examples: ReadonlyArray<CommentPatternExample>;
}

export interface CommentPatternAnalysis {
  readonly totalComments: number;
  readonly patterns: ReadonlyArray<CommentPattern>;
  readonly validationScore: number; // 0–100: higher = more evidence of real problems
  readonly sentimentOverview: {
    readonly overall: number; // -1 to +1: overall sentiment of all comments
    readonly distribution: {
      readonly positive: number; // percentage of positive comments
      readonly neutral: number;  // percentage of neutral comments
      readonly negative: number; // percentage of negative comments
    };
  };
  readonly platformInsights: {
    readonly dominantPlatform: string; // platform with most comments
    readonly platformDistribution: Record<string, number>; // comments per platform
    readonly platformSentiments: Record<string, number>; // sentiment per platform
  };
  readonly temporalTrends: {
    readonly recentActivity: number; // 0-1: how active discussions are recently
    readonly trendDirection: 'increasing' | 'stable' | 'decreasing'; // comment volume trend
  };
  readonly analyzedAt: Date;
}
