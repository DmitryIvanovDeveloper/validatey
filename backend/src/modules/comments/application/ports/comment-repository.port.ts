import ResultEx from '../../../../infrastructure/result/result';
import { CommentEntity } from '../../domain/entities/comment.entity';
import { CommentNotFoundError, CommentError } from '../../domain/errors/comment.error';

export interface CommentRepositoryPort {
  save(comment: CommentEntity): Promise<ResultEx<CommentEntity, CommentError>>;
  bulkSave(comments: CommentEntity[]): Promise<ResultEx<CommentEntity[], CommentError>>;
  findById(id: string): Promise<ResultEx<CommentEntity, CommentNotFoundError>>;
  findByProjectId(projectId: string, options?: {
    limit?: number;
    offset?: number;
    isProcessed?: boolean;
    orderByCreatedAt?: boolean;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<ResultEx<CommentEntity[], CommentError>>;
  /** Find comments by project and list of ids (only returns comments that belong to the project). */
  findByProjectIdAndIds(projectId: string, ids: string[]): Promise<ResultEx<CommentEntity[], CommentError>>;
  findBySourceId(sourceId: string, options?: {
    limit?: number;
    offset?: number;
  }): Promise<ResultEx<CommentEntity[], CommentError>>;
  countByProjectId(projectId: string, options?: { fromDate?: Date; toDate?: Date }): Promise<ResultEx<number, CommentError>>;
  /** Comment counts grouped by time bucket (week or month) for activity chart. */
  getCommentCountsByBucket(projectId: string, options: {
    bucket: 'week' | 'month';
    fromDate?: Date;
    toDate?: Date;
    maxBuckets?: number;
  }): Promise<ResultEx<{ bucket: string; count: number }[], CommentError>>;
  /** Oldest and newest comment createdAt for the project (for freshness warning). */
  getCommentDateRange(projectId: string): Promise<ResultEx<{ oldestCommentAt: Date; newestCommentAt: Date; totalCount: number } | null, CommentError>>;
  countBySourceId(sourceId: string): Promise<ResultEx<number, CommentError>>;
  deleteBySourceId(sourceId: string): Promise<ResultEx<number, CommentError>>;
  getCommentSourcesByProjectId(projectId: string): Promise<ResultEx<{ id: string; sourceType: 'reddit' | 'hackernews' }[], CommentError>>;
}