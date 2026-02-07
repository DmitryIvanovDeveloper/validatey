import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { TYPES as ROUNDS_TYPES } from '../../infrastructure/bootstrap/types';
import type { RoundRepositoryPort } from '../ports/round-repository.port';
import type { DeleteRoundRequest } from './input-output/round.io';
import { RoundNotFoundError } from '../../domain/errors/round.error';

@injectable()
export class DeleteRoundUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(ROUNDS_TYPES.RoundRepository)
    private readonly _repository: RoundRepositoryPort
  ) {}

  async execute(
    request: DeleteRoundRequest
  ): Promise<ResultEx<void, RoundNotFoundError | Error>> {
    this._logger.info('delete-round.start', { projectId: request.projectId, roundId: request.roundId });

    try {
      const findResult = await this._repository.findById(request.roundId);
      if (!findResult.isSuccess) {
        return ResultEx.failure(findResult.error);
      }
      if (findResult.data.projectId !== request.projectId) {
        return ResultEx.failure(new RoundNotFoundError(request.roundId));
      }
      const deleteResult = await this._repository.delete(request.roundId, request.projectId);
      if (!deleteResult.isSuccess) {
        return ResultEx.failure(deleteResult.error);
      }
      this._logger.info('delete-round.success', { projectId: request.projectId, roundId: request.roundId });
      return ResultEx.success(undefined);
    } catch (error) {
      this._logger.error('delete-round.error', { projectId: request.projectId, roundId: request.roundId, error });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }
}
