import ResultEx from '../../../../infrastructure/result/result';
import { CommentError } from '../../domain/errors/comment.error';

export interface FetchJobState {
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  commentsCount: number;
  error?: string;
  currentSourceName?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export interface FetchStatusReadModelPort {
  getStatus(jobId?: string): Promise<ResultEx<FetchJobState[], CommentError>>;
  getLatestStatus(): Promise<ResultEx<FetchJobState | null, CommentError>>;
}