import type { CommentEntity } from '../../domain/entities/comment.entity';
import type { CommentPatternAnalysis } from '../../domain/value-objects/comment-pattern-analysis.vo';
import type { PatternRule, ScoreWeight } from '../../domain/value-objects/pattern-rules.vo';

export interface CommentPatternAnalyzerPort {
  analyze(
    comments: CommentEntity[],
    rules: PatternRule[],
    weights: ScoreWeight[]
  ): CommentPatternAnalysis;
}
