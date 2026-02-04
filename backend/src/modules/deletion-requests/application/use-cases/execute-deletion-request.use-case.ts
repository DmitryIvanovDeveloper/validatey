import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { DeletionRequestNotFoundError, InvalidDeletionRequestDataError } from '../../domain/errors/deletion-request.error';
import { DeletionRequestRepositoryPort } from '../ports/deletion-request-repository.port';
import { PiiDeletionPort } from '../ports/pii-deletion.port';
import { ExecuteDeletionRequestUseCaseRequest, ExecuteDeletionRequestUseCaseResponse } from './input-output/execute-deletion-request.io';
import { TYPES } from '../../infrastructure/bootstrap/types';

@injectable()
export class ExecuteDeletionRequestUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(TYPES.DeletionRequestRepository)
    private readonly _deletionRequestRepository: DeletionRequestRepositoryPort,
    @inject(TYPES.PiiDeletion)
    private readonly _piiDeletion: PiiDeletionPort
  ) {}

  async execute(
    request: ExecuteDeletionRequestUseCaseRequest
  ): Promise<ResultEx<ExecuteDeletionRequestUseCaseResponse, DeletionRequestNotFoundError | InvalidDeletionRequestDataError>> {
    this._logger.info('execute-deletion-request.start', { requestId: request.requestId });

    const findResult = await this._deletionRequestRepository.findById(request.requestId);
    if (!findResult.isSuccess) {
      return ResultEx.failure(findResult.error);
    }
    const deletionRequest = findResult.data;
    if (deletionRequest.status === 'completed' || deletionRequest.status === 'rejected') {
      return ResultEx.failure(
        new InvalidDeletionRequestDataError(`Request ${request.requestId} is already ${deletionRequest.status}`)
      );
    }

    await this._deletionRequestRepository.updateStatus(deletionRequest.id, 'in_progress');

    const deleteResult = await this._piiDeletion.executeByRequestId(deletionRequest.id);
    if (!deleteResult.isSuccess) {
      this._logger.error('execute-deletion-request.pii-deletion-error', { error: deleteResult.error });
      await this._deletionRequestRepository.updateStatus(deletionRequest.id, 'pending');
      return ResultEx.failure(new InvalidDeletionRequestDataError(deleteResult.error.message));
    }

    const updateResult = await this._deletionRequestRepository.updateStatus(deletionRequest.id, 'completed');
    if (!updateResult.isSuccess) {
      this._logger.error('execute-deletion-request.update-status-error', { error: updateResult.error });
      return ResultEx.failure(updateResult.error);
    }

    const updated = updateResult.data;
    this._logger.info('execute-deletion-request.success', { requestId: updated.id });
    return ResultEx.success({
      requestId: updated.id,
      status: 'completed',
      completedAt: updated.completedAt!,
    });
  }
}
