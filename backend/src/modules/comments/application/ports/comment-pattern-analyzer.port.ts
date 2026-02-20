import type { CommentEntity } from '../../domain/entities/comment.entity';
import type { CommentPatternAnalysis } from '../../domain/value-objects/comment-pattern-analysis.vo';

export interface CommentPatternAnalyzerPort {
  analyze(comments: CommentEntity[]): CommentPatternAnalysis;
}
