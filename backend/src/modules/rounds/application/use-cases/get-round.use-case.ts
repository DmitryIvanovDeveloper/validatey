import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { TYPES as ROUNDS_TYPES } from '../../infrastructure/bootstrap/types';
import type { RoundRepositoryPort } from '../ports/round-repository.port';
import type { GetRoundRequest } from './input-output/round.io';
import type { RoundViewDTO } from './input-output/round.io';
import { RoundNotFoundError } from '../../domain/errors/round.error';

function toViewDTO(round: {
  id: string;
  projectId: string;
  parentRoundId: string | null;
  title: string;
  status: string;
  type: string;
  sortOrder: number;
  results: unknown;
  createdAt: Date;
  updatedAt: Date;
}): RoundViewDTO {
  return {
    id: round.id,
    projectId: round.projectId,
    parentRoundId: round.parentRoundId,
    title: round.title,
    status: round.status,
    type: round.type,
    sortOrder: round.sortOrder,
    results: (round.results as RoundViewDTO['results']) ?? null,
    createdAt: round.createdAt.toISOString(),
    updatedAt: round.updatedAt.toISOString(),
  };
}

@injectable()
export class GetRoundUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(ROUNDS_TYPES.RoundRepository)
    private readonly _repository: RoundRepositoryPort
  ) {}

  async execute(
    request: GetRoundRequest
  ): Promise<ResultEx<RoundViewDTO, RoundNotFoundError | Error>> {
    this._logger.info('get-round.start', { projectId: request.projectId, roundId: request.roundId });

    try {
      const result = await this._repository.findById(request.roundId);
      if (!result.isSuccess) {
        return ResultEx.failure(result.error);
      }
      const round = result.data;
      if (round.projectId !== request.projectId) {
        this._logger.warn('get-round.project-mismatch', { projectId: request.projectId, roundId: request.roundId });
        return ResultEx.failure(new RoundNotFoundError(request.roundId));
      }
      this._logger.info('get-round.success', { projectId: request.projectId, roundId: request.roundId });
      return ResultEx.success(toViewDTO(round));
    } catch (error) {
      this._logger.error('get-round.error', { projectId: request.projectId, roundId: request.roundId, error });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }
}
