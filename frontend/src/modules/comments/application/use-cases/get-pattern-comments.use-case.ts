import { injectable, inject } from 'inversify';
import { COMMENT_TYPES } from '../../types';
import type { CommentPatternRepositoryPort } from '../ports/comment-pattern-repository.port';
import Result from '../../../../infrastructure/result/result';

@injectable()
export class GetPatternCommentsUseCase {
  constructor(
    @inject(COMMENT_TYPES.CommentPatternRepository)
    private readonly _repository: CommentPatternRepositoryPort
  ) {}

  async execute(projectId: string, patternType: string): Promise<Result<{ comments: any[]; total: number; pattern: any }, Error>> {
    try {
      const result = await this._repository.getPatternComments(projectId, patternType);
      return Result.success(result);
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error('Failed to get pattern comments'));
    }
  }
}