import { injectable, inject } from 'inversify';
import { COMMENT_TYPES } from '../../types';
import { CommentRepositoryPort } from '../ports/comment-repository.port';
import ResultEx from '../../../../infrastructure/result/result';
import { CommentError } from '../../domain/errors/comment.error';

export interface GetCommentsActivityRequest {
  projectId: string;
  bucket: 'week' | 'month';
  maxBuckets?: number;
  fromDate?: Date;
  toDate?: Date;
}

export interface GetCommentsActivityResponse {
  buckets: { bucket: string; count: number }[];
}

@injectable()
export class GetCommentsActivityUseCase {
  constructor(
    @inject(COMMENT_TYPES.CommentRepository)
    private readonly _commentRepository: CommentRepositoryPort
  ) {}

  async execute(request: GetCommentsActivityRequest): Promise<ResultEx<GetCommentsActivityResponse, CommentError>> {
    try {
      const result = await this._commentRepository.getCommentCountsByBucket(request.projectId, {
        bucket: request.bucket,
        fromDate: request.fromDate,
        toDate: request.toDate,
        maxBuckets: request.maxBuckets ?? 12,
      });
      if (!result.isSuccess) {
        return ResultEx.failure(result.error);
      }
      return ResultEx.success({ buckets: result.data });
    } catch (error) {
      return ResultEx.failure(new CommentError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      ));
    }
  }
}
