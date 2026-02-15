import ResultEx from '../../../../infrastructure/result/result';
import { CommentError } from '../../domain/errors/comment.error';

export interface FetchJob {
  id: string;
  sourceId?: string;
  projectId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFetchJobInput {
  sourceId?: string;
  projectId: string;
  status?: 'pending' | 'running' | 'completed' | 'failed';
}

export interface UpdateFetchJobInput {
  status?: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
  commentsCount?: number;
}

export interface FetchJobRepositoryPort {
  create(input: CreateFetchJobInput): Promise<ResultEx<FetchJob, CommentError>>;
  findById(id: string): Promise<ResultEx<FetchJob, CommentError>>;
  findByProjectId(projectId: string): Promise<ResultEx<FetchJob[], CommentError>>;
  findBySourceId(sourceId: string): Promise<ResultEx<FetchJob[], CommentError>>;
  findRunning(): Promise<ResultEx<FetchJob[], CommentError>>;
  update(id: string, input: UpdateFetchJobInput): Promise<ResultEx<FetchJob, CommentError>>;
}