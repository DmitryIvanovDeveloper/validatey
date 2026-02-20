import { injectable, inject } from 'inversify';
import type { CommentsHttpRepositoryPort } from '../ports/comments-http-repository.port';
import { COMMENT_TYPES } from '../../types';
import Result from '../../../../infrastructure/result/result';

export interface CommentItem {
  id: string;
  sourceId: string;
  projectId: string;
  externalId: string;
  content: string;
  author: string | null;
  url: string;
  contextTitle: string | null;
  contextUrl: string | null;
  createdAt: Date;
  fetchedAt: Date;
  isProcessed: boolean;
  processedAt: Date | null;
  importOrigin: string | null;
  subsourceName: string | null;
  sourceType: 'reddit' | 'hackernews';
}

export interface GetCommentsInput {
  projectId: string;
  sourceId?: string;
  url?: string;
  isProcessed?: boolean;
  limit?: number;
}

export interface GetCommentsOutput {
  comments: CommentItem[];
  totalCount: number;
  hasMore: boolean;
}

@injectable()
export class GetCommentsUseCase {
  constructor(
    @inject(COMMENT_TYPES.CommentsHttpRepository)
    private readonly _repository: CommentsHttpRepositoryPort
  ) {}

  async execute(input: GetCommentsInput): Promise<Result<GetCommentsOutput, Error>> {
    const result = await this._repository.getComments(input.projectId, {
      sourceId: input.sourceId,
      url: input.url,
      isProcessed: input.isProcessed,
      limit: input.limit,
    });

    if (!result.isSuccess) {
      return Result.failure(result.error ?? new Error('Failed to get comments'));
    }

    const comments = result.data.comments.map(comment => ({
      id: comment.id,
      sourceId: comment.sourceId,
      projectId: comment.projectId,
      externalId: comment.externalId,
      content: comment.content,
      author: comment.author,
      url: comment.url,
      contextTitle: comment.contextTitle,
      contextUrl: comment.contextUrl,
      createdAt: new Date(comment.createdAt),
      fetchedAt: new Date(comment.fetchedAt),
      isProcessed: comment.isProcessed,
      processedAt: comment.processedAt ? new Date(comment.processedAt) : null,
      importOrigin: comment.importOrigin,
      subsourceName: comment.subsourceName,
    }));

    return Result.success({
      comments,
      totalCount: result.data.totalCount || comments.length,
      hasMore: result.data.hasMore ?? false,
    });
  }

  async getCommentSources(projectId: string): Promise<Result<{ id: string; sourceType: 'reddit' | 'hackernews'; redditUrl?: string; hnUrl?: string }[], Error>> {
    return this._repository.getCommentSources(projectId);
  }
}