import { injectable, inject } from 'inversify';
import type { CommentsHttpRepositoryPort } from '../ports/comments-http-repository.port';
import { COMMENT_TYPES } from '../../types';
import Result from '../../../../infrastructure/result/result';

export interface GetCommentsFreshnessInput {
  projectId: string;
}

export interface GetCommentsFreshnessOutput {
  oldestCommentAt: string;
  newestCommentAt: string;
  totalCount: number;
  isStale: boolean;
}

@injectable()
export class GetCommentsFreshnessUseCase {
  constructor(
    @inject(COMMENT_TYPES.CommentsHttpRepository)
    private readonly _repository: CommentsHttpRepositoryPort
  ) {}

  async execute(input: GetCommentsFreshnessInput): Promise<Result<GetCommentsFreshnessOutput | null, Error>> {
    const result = await this._repository.getCommentsFreshness(input.projectId);
    if (!result.isSuccess) {
      return Result.failure(result.error ?? new Error('Failed to get comments freshness'));
    }
    return Result.success(result.data);
  }
}
