import { injectable, inject } from 'inversify';
import { COMMENT_TYPES } from '../../types';
import type { CommentPatternRepositoryPort } from '../ports/comment-pattern-repository.port';
import type { CommentPatternAnalysis } from '../../domain/entities/comment-pattern-analysis.entity';
import Result from '../../../../infrastructure/result/result';

@injectable()
export class GetCommentPatternsUseCase {
  constructor(
    @inject(COMMENT_TYPES.CommentPatternRepository)
    private readonly _repository: CommentPatternRepositoryPort
  ) {}

  async execute(projectId: string): Promise<Result<CommentPatternAnalysis, Error>> {
    try {
      const analysis = await this._repository.getPatternAnalysis(projectId);
      return Result.success(analysis);
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error('Failed to analyze comment patterns'));
    }
  }
}
