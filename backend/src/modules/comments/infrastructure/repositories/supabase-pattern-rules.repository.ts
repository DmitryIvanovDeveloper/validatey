import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { getSupabaseClient } from '../../../../infrastructure/database/supabase-client';
import type { PatternRulesRepositoryPort } from '../../application/ports/pattern-rules-repository.port';
import type { PatternRule, ScoreWeight } from '../../domain/value-objects/pattern-rules.vo';
import type { PatternType } from '../../domain/value-objects/comment-pattern-analysis.vo';

@injectable()
export class SupabasePatternRulesRepository implements PatternRulesRepositoryPort {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}

  async getActiveRules(): Promise<ResultEx<PatternRule[], Error>> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('comment_pattern_rules')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) {
        this._logger.error('patternRules.getActiveRules.error', { error });
        return ResultEx.failure(new Error(`Failed to load pattern rules: ${error.message}`));
      }

      const rules: PatternRule[] = (data ?? []).map(row => ({
        id: row.id,
        type: row.type as PatternType,
        label: row.label,
        keywords: row.keywords ?? [],
        insightTemplate: row.insight_template,
        maxExamples: row.max_examples,
        isActive: row.is_active,
      }));

      return ResultEx.success(rules);
    } catch (err) {
      this._logger.error('patternRules.getActiveRules.exception', { err });
      return ResultEx.failure(new Error(err instanceof Error ? err.message : 'Unknown error'));
    }
  }

  async getScoreWeights(): Promise<ResultEx<ScoreWeight[], Error>> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('comment_score_weights')
        .select('*');

      if (error) {
        this._logger.error('patternRules.getScoreWeights.error', { error });
        return ResultEx.failure(new Error(`Failed to load score weights: ${error.message}`));
      }

      const weights: ScoreWeight[] = (data ?? []).map(row => ({
        patternType: row.pattern_type as PatternType,
        maxScore: row.max_score,
        multiplier: row.multiplier,
        volumeBonus50: row.volume_bonus_50,
        volumeBonus100: row.volume_bonus_100,
      }));

      return ResultEx.success(weights);
    } catch (err) {
      this._logger.error('patternRules.getScoreWeights.exception', { err });
      return ResultEx.failure(new Error(err instanceof Error ? err.message : 'Unknown error'));
    }
  }
}
