/** Legacy fixed types (used by pattern rules / keyword analyzer). Comment patterns may use these or project-defined slugs. */
export type PatternType = 'myth' | 'failure' | 'advice' | 'validation' | 'feature_request' | 'comparison' | 'workaround' | 'emotion';

/**
 * Semantic category of the evidence a pattern represents:
 * - 'direct': comment directly supports the hypothesis
 * - 'alternative': users describe another solution/workaround (comparison, workaround type)
 * - 'contradictory': comment actively contradicts or weakens the hypothesis
 * - 'neutral': context or signal without clear direction
 */
export type EvidenceType = 'direct' | 'alternative' | 'contradictory' | 'neutral';

/**
 * Data quality indicator per pattern, filled server-side after enrichment.
 * Based on how many real commentIds were matched vs invented examples.
 */
export type DataConfidence = 'high' | 'medium' | 'low' | 'none';

export interface CommentPatternExample {
  readonly content: string;
  readonly author: string;
  readonly source: string;
  readonly url?: string; // Link to original comment for attribution
}

export interface CommentPattern {
  /** Pattern type: AI-defined slug from project context (e.g. feedback_seeking, reciprocity_concern). Short snake_case. */
  readonly type: string;
  readonly label: string;
  readonly insight: string;
  readonly count: number;
  readonly percentage: number;
  readonly sentimentScore: number; // -1 (very negative) to +1 (very positive), 0 = neutral
  readonly confidenceScore: number; // 0-1: AI confidence in this pattern analysis
  readonly recencyScore: number; // 0-1: how recent this pattern is (1 = very recent)
  /** True = supports hypothesis, false = contradicts or weakens, undefined = neutral. Used for assumption evidence. */
  readonly supportsHypothesis?: boolean;
  /** Semantic category of evidence. Derived server-side from supportsHypothesis + type; LLM may also set it explicitly. */
  readonly evidenceType?: EvidenceType;
  /** Data quality: filled server-side based on commentIds count and unique author diversity after enrichment. */
  readonly dataConfidence?: DataConfidence;
  /**
   * Keywords describing this pattern (provided by LLM, max 10).
   * The server uses these to match real commentIds from the full comment corpus.
   */
  readonly keywords?: ReadonlyArray<string>;
  readonly commentIds?: ReadonlyArray<string>; // IDs of all comments in this pattern; filled server-side via keyword matching
  /** Number of unique authors in this pattern; many unique authors = stronger validation signal. Filled server-side when commentIds exist. */
  readonly uniqueAuthorCount?: number;
  /** Number of unique subreddits (Reddit) where this pattern appears; recurrence across communities = strong signal. */
  readonly subredditCount?: number;
  /** Subreddit names where this pattern was found (Reddit only). */
  readonly subredditNames?: ReadonlyArray<string>;
  readonly examples: ReadonlyArray<CommentPatternExample>;
}

export interface CommentPatternAnalysis {
  readonly totalComments: number;
  readonly patterns: ReadonlyArray<CommentPattern>;
  /** 0–100: deterministic score computed from actual commentIds counts and diversity, not LLM estimate. */
  readonly validationScore: number;
  /** Number of comments covered by at least one pattern after enrichment. */
  readonly classifiedComments?: number;
  /** coverageRatio = classifiedComments / totalComments. Low = score is less representative. */
  readonly coverageRatio?: number;
  readonly sentimentOverview: {
    readonly overall: number; // -1 to +1: overall sentiment of all comments
    readonly distribution: {
      readonly positive: number; // percentage of positive comments
      readonly neutral: number;  // percentage of neutral comments
      readonly negative: number; // percentage of negative comments
    };
  };
  readonly platformInsights?: {
    readonly dominantPlatform: string; // platform with most comments
    readonly platformDistribution: Record<string, number>; // comments per platform
    readonly platformSentiments: Record<string, number>; // sentiment per platform
    /** Reddit: comments per subreddit (subsourceName). */
    readonly subredditDistribution?: Record<string, number>;
    /** 0–1: how much the same patterns recur across subreddits (strong validation signal). */
    readonly recurrenceScore?: number;
  };
  readonly temporalTrends: {
    readonly recentActivity: number; // 0-1: how active discussions are recently
    readonly trendDirection: 'increasing' | 'stable' | 'decreasing'; // comment volume trend
  };
  readonly analyzedAt: Date;
}
