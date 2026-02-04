import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { InvalidDeletionRequestDataError } from '../../domain/errors/deletion-request.error';
import { DeletionRequestRepositoryPort } from '../ports/deletion-request-repository.port';
import {
  ListDeletionRequestsByProjectUseCaseRequest,
  ListDeletionRequestsByProjectUseCaseResponse,
} from './input-output/list-deletion-requests.io';
import { TYPES } from '../../infrastructure/bootstrap/types';

@injectable()
export class ListDeletionRequestsByProjectUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(TYPES.DeletionRequestRepository)
    private readonly _repository: DeletionRequestRepositoryPort
  ) {}

  async execute(
    request: ListDeletionRequestsByProjectUseCaseRequest
  ): Promise<ResultEx<ListDeletionRequestsByProjectUseCaseResponse, InvalidDeletionRequestDataError>> {
    this._logger.info('list-deletion-requests.start', { projectId: request.projectId });

    if (!request.projectId?.trim()) {
      return ResultEx.failure(new InvalidDeletionRequestDataError('projectId is required'));
    }

    const listResult = await this._repository.findByProjectId(request.projectId.trim());
    if (!listResult.isSuccess) {
      this._logger.error('list-deletion-requests.error', { error: listResult.error });
      return ResultEx.failure(new InvalidDeletionRequestDataError(listResult.error.message));
    }

    const requests = listResult.data.map((r) => ({
      id: r.id,
      projectId: r.projectId,
      identifier: r.identifier,
      status: r.status,
      requestedAt: r.requestedAt,
      completedAt: r.completedAt,
      requestedBy: r.requestedBy,
      createdAt: r.createdAt,
    }));

    return ResultEx.success({ requests });
  }
}
