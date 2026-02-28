import { injectable, inject } from 'inversify';
import type { CommentsHttpRepositoryPort } from '../ports/comments-http-repository.port';
import { COMMENT_TYPES } from '../../types';
import Result from '../../../../infrastructure/result/result';

export interface GetCommentsActivityInput {
  projectId: string;
  bucket: 'week' | 'month';
  maxBuckets?: number;
}

export interface GetCommentsActivityOutput {
  buckets: { bucket: string; count: number }[];
}

@injectable()
export class GetCommentsActivityUseCase {
  constructor(
    @inject(COMMENT_TYPES.CommentsHttpRepository)
    private readonly _repository: CommentsHttpRepositoryPort
  ) {}

  async execute(input: GetCommentsActivityInput): Promise<Result<GetCommentsActivityOutput, Error>> {
    const result = await this._repository.getCommentsActivity(input.projectId, {
      bucket: input.bucket,
      maxBuckets: input.maxBuckets,
    });
    if (!result.isSuccess) {
      return Result.failure(result.error ?? new Error('Failed to get comments activity'));
    }
    return Result.success({ buckets: result.data.buckets });
  }
}
