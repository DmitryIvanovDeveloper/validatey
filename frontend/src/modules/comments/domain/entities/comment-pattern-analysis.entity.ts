export type PatternType = 'myth' | 'failure' | 'advice' | 'validation' | 'feature_request' | 'comparison' | 'workaround' | 'emotion';

export interface CommentPatternExample {
  readonly content: string;
  readonly author: string;
  readonly source: string;
}

export interface CommentPattern {
  readonly type: PatternType;
  readonly label: string;
  readonly insight: string;
  readonly count: number;
  readonly percentage: number;
  /** When present, UI shows "Show N comments" and loads via API; otherwise uses examples. */
  readonly commentIds?: ReadonlyArray<string>;
  /** Unique authors in this pattern; many = stronger validation signal. Filled by backend. */
  readonly uniqueAuthorCount?: number;
  /** Number of subreddits where this pattern appears (Reddit); recurrence = strong signal. */
  readonly subredditCount?: number;
  /** Subreddit names where this pattern was found (Reddit only). */
  readonly subredditNames?: ReadonlyArray<string>;
  readonly examples: ReadonlyArray<CommentPatternExample>;
}

/** Optional platform-level insights (subreddit distribution, recurrence). */
export interface CommentPatternPlatformInsights {
  readonly subredditDistribution?: Record<string, number>;
  readonly recurrenceScore?: number;
}

export interface CommentPatternAnalysis {
  readonly totalComments: number;
  readonly patterns: ReadonlyArray<CommentPattern>;
  readonly validationScore: number;
  readonly analyzedAt: string;
  /** Reddit: subreddit distribution and recurrence across communities. */
  readonly platformInsights?: CommentPatternPlatformInsights;
}
