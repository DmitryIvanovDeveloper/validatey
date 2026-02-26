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
  readonly examples: ReadonlyArray<CommentPatternExample>;
}

export interface CommentPatternAnalysis {
  readonly totalComments: number;
  readonly patterns: ReadonlyArray<CommentPattern>;
  readonly validationScore: number;
  readonly analyzedAt: string;
}
