import ResultEx from '../../../../infrastructure/result/result';
import { Task } from '../../domain/entities/task.entity';
import { TaskNotFoundError, InvalidTaskDataError } from '../../domain/errors/task.error';

export interface TaskRepositoryPort {
  create(task: Task): Promise<ResultEx<Task, InvalidTaskDataError>>;
  findById(id: string): Promise<ResultEx<Task, TaskNotFoundError>>;
  findByStatus(status: Task['status']): Promise<ResultEx<Task[], Error>>;
  update(task: Task): Promise<ResultEx<Task, TaskNotFoundError | InvalidTaskDataError>>;
  findPendingTasks(limit?: number): Promise<ResultEx<Task[], Error>>;
}

