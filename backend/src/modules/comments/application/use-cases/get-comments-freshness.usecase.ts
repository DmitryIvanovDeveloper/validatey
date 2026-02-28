import { injectable, inject } from 'inversify';
import { COMMENT_TYPES } from '../../types';
import { CommentRepositoryPort } from '../ports/comment-repository.port';
import ResultEx from '../../../../infrastructure/result/result';
import { CommentError } from '../../domain/errors/comment.error';

/** Months after which data is considered stale for the warning. */
const STALE_THRESHOLD_MONTHS = 6;

export interface GetCommentsFreshnessRequest {
  projectId: string;
}

export interface GetCommentsFreshnessResponse {
  oldestCommentAt: Date;
  newestCommentAt: Date;
  totalCount: number;
  /** True if the newest comment is older than STALE_THRESHOLD_MONTHS. */
  isStale: boolean;
}

@injectable()
export class GetCommentsFreshnessUseCase {
  constructor(
    @inject(COMMENT_TYPES.CommentRepository)
    private readonly _commentRepository: CommentRepositoryPort
  ) {}

  async execute(request: GetCommentsFreshnessRequest): Promise<ResultEx<GetCommentsFreshnessResponse | null, CommentError>> {
    try {
      const result = await this._commentRepository.getCommentDateRange(request.projectId);
      if (!result.isSuccess) {
        return ResultEx.failure(result.error);
      }
      const range = result.data;
      if (!range) {
        return ResultEx.success(null);
      }
      const threshold = new Date();
      threshold.setMonth(threshold.getMonth() - STALE_THRESHOLD_MONTHS);
      const isStale = range.newestCommentAt < threshold;
      return ResultEx.success({
        oldestCommentAt: range.oldestCommentAt,
        newestCommentAt: range.newestCommentAt,
        totalCount: range.totalCount,
        isStale,
      });
    } catch (error) {
      return ResultEx.failure(new CommentError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      ));
    }
  }
}
