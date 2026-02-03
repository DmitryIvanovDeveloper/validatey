import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { TaskEntity } from '../../domain/entities/task.entity';
import { InvalidTaskDataError } from '../../domain/errors/task.error';
import { TaskRepositoryPort } from '../ports/task-repository.port';
import { TaskQueuePort } from '../ports/task-queue.port';
import { CreateTaskUseCaseRequest, CreateTaskUseCaseResponse } from './input-output/create-task.io';
import { TYPES } from '../../infrastructure/bootstrap/types';

@injectable()
export class CreateTaskUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(TYPES.TaskRepository)
    private readonly _repository: TaskRepositoryPort,
    @inject(TYPES.TaskQueue)
    private readonly _queue: TaskQueuePort
  ) {}

  async execute(
    request: CreateTaskUseCaseRequest
  ): Promise<ResultEx<CreateTaskUseCaseResponse, InvalidTaskDataError>> {
    this._logger.info('create-task.start', { type: request.type });

    try {
      const task = TaskEntity.create(request.type, request.payload, request.maxRetries, request.deadline);

      const saveResult = await this._repository.create(task.toData());

      if (!saveResult.isSuccess) {
        this._logger.error('create-task.save-error', { error: saveResult.error });
        return ResultEx.failure(saveResult.error);
      }

      // Enqueue task
      const enqueueResult = await this._queue.enqueue(saveResult.data);

      if (!enqueueResult.isSuccess) {
        this._logger.error('create-task.enqueue-error', { error: enqueueResult.error });
        return ResultEx.failure(enqueueResult.error);
      }

      this._logger.info('create-task.success', { taskId: saveResult.data.id });

      return ResultEx.success({
        task: saveResult.data,
      });
    } catch (error) {
      this._logger.error('create-task.error', { error });
      if (error instanceof InvalidTaskDataError) {
        return ResultEx.failure(error);
      }
      return ResultEx.failure(new InvalidTaskDataError(error instanceof Error ? error.message : 'Unknown error'));
    }
  }
}



