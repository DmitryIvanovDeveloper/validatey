import ResultEx from '../../../../infrastructure/result/result';
import { Task } from '../../domain/entities/task.entity';
import { InvalidTaskDataError } from '../../domain/errors/task.error';

export interface TaskQueuePort {
  enqueue(task: Task): Promise<ResultEx<void, InvalidTaskDataError>>;
  dequeue(type?: Task['type']): Promise<ResultEx<Task | null, Error>>;
  subscribe(callback: (task: Task) => Promise<void>): void;
}


