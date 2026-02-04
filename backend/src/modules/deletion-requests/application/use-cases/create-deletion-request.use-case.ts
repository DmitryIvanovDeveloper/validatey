import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { DeletionRequestEntity } from '../../domain/entities/deletion-request.entity';
import { InvalidDeletionRequestDataError } from '../../domain/errors/deletion-request.error';
import { DeletionRequestRepositoryPort } from '../ports/deletion-request-repository.port';
import { NotificationServicePort } from '../ports/notification-service.port';
import { CreateDeletionRequestUseCaseRequest, CreateDeletionRequestUseCaseResponse } from './input-output/create-deletion-request.io';
import { TYPES } from '../../infrastructure/bootstrap/types';

@injectable()
export class CreateDeletionRequestUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(TYPES.DeletionRequestRepository)
    private readonly _repository: DeletionRequestRepositoryPort,
    @inject(TYPES.NotificationService)
    private readonly _notificationService: NotificationServicePort
  ) {}

  async execute(
    request: CreateDeletionRequestUseCaseRequest
  ): Promise<ResultEx<CreateDeletionRequestUseCaseResponse, InvalidDeletionRequestDataError>> {
    this._logger.info('create-deletion-request.start', { projectId: request.projectId });

    if (!request.projectId?.trim()) {
      return ResultEx.failure(new InvalidDeletionRequestDataError('projectId is required'));
    }
    if (!request.identifier?.trim()) {
      return ResultEx.failure(new InvalidDeletionRequestDataError('identifier is required'));
    }

    const entity = DeletionRequestEntity.create(
      request.projectId.trim(),
      request.identifier.trim(),
      request.requestedBy ?? null
    );
    const saveResult = await this._repository.save(entity.toData());
    if (!saveResult.isSuccess) {
      this._logger.error('create-deletion-request.save-error', { error: saveResult.error });
      return ResultEx.failure(saveResult.error);
    }

    const saved = saveResult.data;
    const notifyResult = await this._notificationService.sendDeletionRequestNotification(saved.projectId, {
      projectId: saved.projectId,
      requestId: saved.id,
      identifier: saved.identifier,
      requestedAt: saved.requestedAt,
    });
    if (!notifyResult.isSuccess) {
      this._logger.warn('create-deletion-request.notify-failed', { error: notifyResult.error });
      // Do not fail the use case; request was created
    }

    this._logger.info('create-deletion-request.success', { requestId: saved.id });
    return ResultEx.success({
      request: {
        id: saved.id,
        projectId: saved.projectId,
        identifier: saved.identifier,
        status: saved.status,
        requestedAt: saved.requestedAt,
      },
    });
  }
}
