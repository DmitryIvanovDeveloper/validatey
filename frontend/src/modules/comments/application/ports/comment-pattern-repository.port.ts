import type { CommentPatternAnalysis } from '../../domain/entities/comment-pattern-analysis.entity';

export interface CommentPatternRepositoryPort {
  getPatternAnalysis(projectId: string): Promise<CommentPatternAnalysis>;
}
