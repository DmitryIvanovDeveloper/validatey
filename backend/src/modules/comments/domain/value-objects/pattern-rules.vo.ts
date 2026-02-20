import type { PatternType } from './comment-pattern-analysis.vo';

export interface PatternRule {
  readonly id: string;
  readonly type: PatternType;
  readonly label: string;
  readonly keywords: string[];
  readonly insightTemplate: string; // '{count} comments ({pct}%) ...'
  readonly maxExamples: number;
  readonly isActive: boolean;
}

export interface ScoreWeight {
  readonly patternType: PatternType;
  readonly maxScore: number;
  readonly multiplier: number;
  readonly volumeBonus50: number;
  readonly volumeBonus100: number;
}
