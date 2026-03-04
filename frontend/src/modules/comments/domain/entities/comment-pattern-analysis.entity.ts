export type PatternType = 'myth' | 'failure' | 'advice' | 'validation' | 'feature_request' | 'comparison' | 'workaround' | 'emotion';

/**
 * Semantic category of evidence:
 * - 'direct': comment directly supports the hypothesis
 * - 'alternative': users describe another solution/workaround
 * - 'contradictory': comment actively contradicts the hypothesis
 * - 'neutral': context or signal without clear direction
 */
export type EvidenceType = 'direct' | 'alternative' | 'contradictory' | 'neutral';

/** Data quality per pattern, based on real commentIds matched vs total. */
export type DataConfidence = 'high' | 'medium' | 'low' | 'none';

export interface CommentPatternExample {
  readonly content: string;
  readonly author: string;
  readonly source: string;
}

export interface CommentPattern {
  readonly type: string;
  readonly label: string;
  readonly insight: string;
  readonly count: number;
  readonly percentage: number;
  /** When present, UI shows "Show N comments" and loads via API; otherwise uses examples. */
  /** Keywords describing this pattern; used by backend for deterministic comment matching. */
  readonly keywords?: ReadonlyArray<string>;
  readonly commentIds?: ReadonlyArray<string>;
  /** Unique authors in this pattern; many = stronger validation signal. Filled by backend. */
  readonly uniqueAuthorCount?: number;
  /** Number of subreddits where this pattern appears (Reddit); recurrence = strong signal. */
  readonly subredditCount?: number;
  /** Subreddit names where this pattern was found (Reddit only). */
  readonly subredditNames?: ReadonlyArray<string>;
  /** Semantic category of evidence, filled server-side. */
  readonly evidenceType?: EvidenceType;
  /** Data quality indicator, filled server-side. */
  readonly dataConfidence?: DataConfidence;
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
  /** Deterministic validation score computed from real commentIds, not LLM estimate. */
  readonly validationScore: number;
  /** Number of comments covered by at least one pattern. */
  readonly classifiedComments?: number;
  /** coverageRatio = classifiedComments / totalComments. */
  readonly coverageRatio?: number;
  readonly analyzedAt: string;
  /** Reddit: subreddit distribution and recurrence across communities. */
  readonly platformInsights?: CommentPatternPlatformInsights;
}
