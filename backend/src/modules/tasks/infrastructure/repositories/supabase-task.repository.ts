import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { getSupabaseClient } from '../../../../infrastructure/database/supabase-client';
import { Task, TaskType, TaskStatus } from '../../domain/entities/task.entity';
import { TaskNotFoundError, InvalidTaskDataError } from '../../domain/errors/task.error';
import { TaskRepositoryPort } from '../../application/ports/task-repository.port';

@injectable()
export class SupabaseTaskRepository implements TaskRepositoryPort {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}

  async create(task: Task): Promise<ResultEx<Task, InvalidTaskDataError>> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          id: task.id,
          type: task.type,
          status: task.status,
          payload: task.payload,
          result: task.result,
          error_message: task.errorMessage,
          retry_count: task.retryCount,
          max_retries: task.maxRetries,
          deadline: task.deadline?.toISOString() || null,
          started_at: task.startedAt?.toISOString() || null,
          completed_at: task.completedAt?.toISOString() || null,
          created_at: task.createdAt.toISOString(),
          updated_at: task.updatedAt.toISOString(),
        })
        .select()
        .single();

      if (error) {
        this._logger.error('supabase-task-repository.create-error', { error });
        return ResultEx.failure(new InvalidTaskDataError(error.message));
      }

      return ResultEx.success(this.mapToDomain(data));
    } catch (error) {
      this._logger.error('supabase-task-repository.create-exception', { error });
      return ResultEx.failure(
        new InvalidTaskDataError(error instanceof Error ? error.message : 'Unknown error')
      );
    }
  }

  async findById(id: string): Promise<ResultEx<Task, TaskNotFoundError>> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase.from('tasks').select('*').eq('id', id).single();

      if (error || !data) {
        this._logger.error('supabase-task-repository.find-by-id-error', { id, error });
        return ResultEx.failure(new TaskNotFoundError(id));
      }

      return ResultEx.success(this.mapToDomain(data));
    } catch (error) {
      this._logger.error('supabase-task-repository.find-by-id-exception', { id, error });
      return ResultEx.failure(new TaskNotFoundError(id));
    }
  }

  async findByStatus(status: Task['status']): Promise<ResultEx<Task[], Error>> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase.from('tasks').select('*').eq('status', status).order('created_at', { ascending: true });

      if (error) {
        this._logger.error('supabase-task-repository.find-by-status-error', { status, error });
        return ResultEx.failure(new Error(error.message));
      }

      return ResultEx.success(data.map((item) => this.mapToDomain(item)));
    } catch (error) {
      this._logger.error('supabase-task-repository.find-by-status-exception', { status, error });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async update(task: Task): Promise<ResultEx<Task, TaskNotFoundError | InvalidTaskDataError>> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('tasks')
        .update({
          status: task.status,
          payload: task.payload,
          result: task.result,
          error_message: task.errorMessage,
          retry_count: task.retryCount,
          started_at: task.startedAt?.toISOString() || null,
          completed_at: task.completedAt?.toISOString() || null,
          updated_at: task.updatedAt.toISOString(),
        })
        .eq('id', task.id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          this._logger.error('supabase-task-repository.update-not-found', { id: task.id });
          return ResultEx.failure(new TaskNotFoundError(task.id));
        }
        this._logger.error('supabase-task-repository.update-error', { error });
        return ResultEx.failure(new InvalidTaskDataError(error.message));
      }

      return ResultEx.success(this.mapToDomain(data));
    } catch (error) {
      this._logger.error('supabase-task-repository.update-exception', { error });
      return ResultEx.failure(
        new InvalidTaskDataError(error instanceof Error ? error.message : 'Unknown error')
      );
    }
  }

  async findPendingTasks(limit: number = 10): Promise<ResultEx<Task[], Error>> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) {
        this._logger.error('supabase-task-repository.find-pending-error', { error });
        return ResultEx.failure(new Error(error.message));
      }

      return ResultEx.success(data.map((item) => this.mapToDomain(item)));
    } catch (error) {
      this._logger.error('supabase-task-repository.find-pending-exception', { error });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  private mapToDomain(data: Record<string, unknown>): Task {
    const d = data as { id: string; type: string; status: string; payload: Task['payload']; result: Task['result']; error_message: string | null; retry_count: number; max_retries: number; deadline: string | null; started_at: string | null; completed_at: string | null; created_at: string; updated_at: string };
    return {
      id: d.id,
      type: d.type as TaskType,
      status: d.status as TaskStatus,
      payload: d.payload,
      result: d.result,
      errorMessage: d.error_message,
      retryCount: d.retry_count,
      maxRetries: d.max_retries,
      deadline: d.deadline ? new Date(d.deadline) : null,
      startedAt: d.started_at ? new Date(d.started_at) : null,
      completedAt: d.completed_at ? new Date(d.completed_at) : null,
      createdAt: new Date(d.created_at),
      updatedAt: new Date(d.updated_at),
    };
  }
}



