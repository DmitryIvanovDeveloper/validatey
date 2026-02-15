import ResultEx from '../../../../infrastructure/result/result';
import { CommentSourceError } from '../../domain/errors/comment.error';

export interface CommentSource {
  id: string;
  projectId: string;
  sourceType: 'reddit' | 'hackernews';
  redditUrl?: string;
  subredditName?: string;
  postId?: string;
  hnFeedType?: string;
  hnUrl?: string;
  hnItemId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCommentSourceInput {
  projectId: string;
  sourceType: 'reddit' | 'hackernews';
  redditUrl?: string;
  subredditName?: string;
  postId?: string;
  hnFeedType?: string;
  hnUrl?: string;
  hnItemId?: string;
}

export interface CommentSourceRepositoryPort {
  create(input: CreateCommentSourceInput): Promise<ResultEx<CommentSource, CommentSourceError>>;
  findById(id: string): Promise<ResultEx<CommentSource, CommentSourceError>>;
  findByProjectId(projectId: string): Promise<ResultEx<CommentSource[], CommentSourceError>>;
  findAll(): Promise<ResultEx<CommentSource[], CommentSourceError>>;
  delete(id: string): Promise<ResultEx<void, CommentSourceError>>;
}