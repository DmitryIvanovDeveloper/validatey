import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { getSupabaseClient } from '../../../../infrastructure/database/supabase-client';
import { Task } from '../../domain/entities/task.entity';
import { InvalidTaskDataError } from '../../domain/errors/task.error';
import { TaskQueuePort } from '../../application/ports/task-queue.port';

@injectable()
export class SupabaseRealtimeQueueService implements TaskQueuePort {
  private subscribers: Array<(task: Task) => Promise<void>> = [];
  private isSubscribed: boolean = false;

  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {
    this.subscribeToRealtime();
  }

  async enqueue(task: Task): Promise<ResultEx<void, InvalidTaskDataError>> {
    this._logger.info('supabase-realtime-queue.enqueue', { taskId: task.id, type: task.type });

    // Task is already created in repository, just notify subscribers
    // In a real implementation, we would use Supabase Realtime to broadcast
    for (const subscriber of this.subscribers) {
      try {
        await subscriber(task);
      } catch (error) {
        this._logger.error('supabase-realtime-queue.subscriber-error', { error });
      }
    }

    return ResultEx.success(undefined);
  }

  async dequeue(type?: Task['type']): Promise<ResultEx<Task | null, Error>> {
    try {
      const supabase = getSupabaseClient();

      let query = supabase.from('tasks').select('*').eq('status', 'pending').order('created_at', { ascending: true }).limit(1);

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;

      if (error) {
        this._logger.error('supabase-realtime-queue.dequeue-error', { error });
        return ResultEx.failure(new Error(error.message));
      }

      if (!data || data.length === 0) {
        return ResultEx.success(null);
      }

      // Map to domain
      const task: Task = {
        id: data[0].id,
        type: data[0].type,
        status: data[0].status,
        payload: data[0].payload,
        result: data[0].result,
        errorMessage: data[0].error_message,
        retryCount: data[0].retry_count,
        maxRetries: data[0].max_retries,
        deadline: data[0].deadline ? new Date(data[0].deadline) : null,
        startedAt: data[0].started_at ? new Date(data[0].started_at) : null,
        completedAt: data[0].completed_at ? new Date(data[0].completed_at) : null,
        createdAt: new Date(data[0].created_at),
        updatedAt: new Date(data[0].updated_at),
      };

      return ResultEx.success(task);
    } catch (error) {
      this._logger.error('supabase-realtime-queue.dequeue-exception', { error });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  subscribe(callback: (task: Task) => Promise<void>): void {
    this.subscribers.push(callback);
    this._logger.info('supabase-realtime-queue.subscribe', { subscriberCount: this.subscribers.length });
  }

  private subscribeToRealtime(): void {
    if (this.isSubscribed) {
      return;
    }

    try {
      const supabase = getSupabaseClient();

      supabase
        .channel('tasks')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'tasks',
            filter: 'status=eq.pending',
          },
          (payload) => {
            this._logger.info('supabase-realtime-queue.new-task', { taskId: payload.new.id });
            // Notify all subscribers
            const raw = payload.new as {
              id: string;
              type: import('../../domain/entities/task.entity').TaskType;
              status: import('../../domain/entities/task.entity').TaskStatus;
              payload: Task['payload'];
              result: Task['result'];
              error_message: string | null;
              retry_count: number;
              max_retries: number;
              deadline: string | null;
              started_at: string | null;
              completed_at: string | null;
              created_at: string;
              updated_at: string;
            };
            const domainTask: Task = {
              id: raw.id,
              type: raw.type,
              status: raw.status,
              payload: raw.payload,
              result: raw.result,
              errorMessage: raw.error_message,
              retryCount: raw.retry_count,
              maxRetries: raw.max_retries,
              deadline: raw.deadline ? new Date(raw.deadline) : null,
              startedAt: raw.started_at ? new Date(raw.started_at) : null,
              completedAt: raw.completed_at ? new Date(raw.completed_at) : null,
              createdAt: new Date(raw.created_at),
              updatedAt: new Date(raw.updated_at),
            };

            for (const subscriber of this.subscribers) {
              subscriber(domainTask).catch((error) => {
                this._logger.error('supabase-realtime-queue.subscriber-error', { error });
              });
            }
          }
        )
        .subscribe();

      this.isSubscribed = true;
      this._logger.info('supabase-realtime-queue.subscribed');
    } catch (error) {
      this._logger.error('supabase-realtime-queue.subscribe-error', { error });
    }
  }
}



