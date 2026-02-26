import type { CommentPatternAnalysis } from '../../domain/entities/comment-pattern-analysis.entity';

export interface CommentPatternRepositoryPort {
  getPatternAnalysis(projectId: string): Promise<CommentPatternAnalysis>;
  getPatternComments(projectId: string, patternType: string): Promise<{ comments: any[]; total: number; pattern: any }>;
}
