import { injectable, inject } from 'inversify';
import type { CommentsHttpRepositoryPort, CommentDTO } from '../ports/comments-http-repository.port';
import { COMMENT_TYPES } from '../../types';
import Result from '../../../../infrastructure/result/result';

export interface GetCommentsByAuthorInput {
  projectId: string;
  author: string;
  sourceType?: 'reddit' | 'hackernews';
  supportingOnly?: boolean;
  limit?: number;
}

export interface GetCommentsByAuthorOutput {
  comments: CommentDTO[];
}

@injectable()
export class GetCommentsByAuthorUseCase {
  constructor(
    @inject(COMMENT_TYPES.CommentsHttpRepository)
    private readonly _repository: CommentsHttpRepositoryPort
  ) {}

  async execute(input: GetCommentsByAuthorInput): Promise<Result<GetCommentsByAuthorOutput, Error>> {
    const result = await this._repository.getCommentsByAuthor(input.projectId, {
      author: input.author,
      sourceType: input.sourceType,
      supportingOnly: input.supportingOnly,
      limit: input.limit,
    });
    if (!result.isSuccess) {
      return Result.failure(result.error ?? new Error('Failed to get comments by author'));
    }
    return Result.success({ comments: result.data.comments });
  }
}
