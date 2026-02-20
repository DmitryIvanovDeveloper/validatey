import type { PatternRule, ScoreWeight } from '../../domain/value-objects/pattern-rules.vo';
import type ResultEx from '../../../../infrastructure/result/result';

export interface PatternRulesRepositoryPort {
  getActiveRules(): Promise<ResultEx<PatternRule[], Error>>;
  getScoreWeights(): Promise<ResultEx<ScoreWeight[], Error>>;
}
