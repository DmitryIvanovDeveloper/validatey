export type PatternType = 'myth' | 'failure' | 'advice' | 'validation';

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
  readonly examples: ReadonlyArray<CommentPatternExample>;
}

export interface CommentPatternAnalysis {
  readonly totalComments: number;
  readonly patterns: ReadonlyArray<CommentPattern>;
  readonly validationScore: number; // 0–100: higher = more evidence of real problems
  readonly analyzedAt: Date;
}
