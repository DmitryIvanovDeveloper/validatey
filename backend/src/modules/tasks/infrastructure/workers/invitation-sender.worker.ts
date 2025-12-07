import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import { TaskEntity } from '../../domain/entities/task.entity';
import { TaskRepositoryPort } from '../../application/ports/task-repository.port';
import { TYPES } from '../../infrastructure/bootstrap/types';

@injectable()
export class InvitationSenderWorker {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(TYPES.TaskRepository)
    private readonly _repository: TaskRepositoryPort
  ) {}

  async process(task: TaskEntity): Promise<void> {
    this._logger.info('invitation-sender-worker.process.start', { taskId: task.id });

    try {
      // Mark as processing
      const processingTask = task.markAsProcessing();
      await this._repository.update(processingTask.toData());

      // TODO: Call invitation send use case
      // For now, just mark as completed
      const completedTask = processingTask.markAsCompleted({ success: true });

      const updateResult = await this._repository.update(completedTask.toData());

      if (!updateResult.isSuccess) {
        this._logger.error('invitation-sender-worker.process.update-error', { error: updateResult.error });
        throw updateResult.error;
      }

      this._logger.info('invitation-sender-worker.process.success', { taskId: task.id });
    } catch (error) {
      this._logger.error('invitation-sender-worker.process.error', { taskId: task.id, error });

      // Mark as failed
      const failedTask = task.markAsFailed(error instanceof Error ? error.message : 'Unknown error');
      await this._repository.update(failedTask.toData());
    }
  }
}


