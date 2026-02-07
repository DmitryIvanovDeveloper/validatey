import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { TYPES as ROUNDS_TYPES } from '../../infrastructure/bootstrap/types';
import type { RoundRepositoryPort } from '../ports/round-repository.port';
import { RoundEntity } from '../../domain/entities/round.entity';
import { RoundNotFoundError } from '../../domain/errors/round.error';
import type { InvalidRoundDataError } from '../../domain/errors/round.error';
import type { UpdateRoundRequest, RoundViewDTO } from './input-output/round.io';

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
export class UpdateRoundUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(ROUNDS_TYPES.RoundRepository)
    private readonly _repository: RoundRepositoryPort
  ) {}

  async execute(
    request: UpdateRoundRequest
  ): Promise<ResultEx<RoundViewDTO, RoundNotFoundError | InvalidRoundDataError | Error>> {
    this._logger.info('update-round.start', { projectId: request.projectId, roundId: request.roundId });

    try {
      const findResult = await this._repository.findById(request.roundId);
      if (!findResult.isSuccess) {
        return ResultEx.failure(findResult.error);
      }
      let entity = RoundEntity.fromData(findResult.data);
      if (entity.projectId !== request.projectId) {
        return ResultEx.failure(new RoundNotFoundError(request.roundId));
      }
      if (request.title !== undefined) {
        entity = entity.withTitle(request.title);
      }
      if (request.status !== undefined) {
        entity = entity.withStatus(request.status);
      }
      if (request.type !== undefined) {
        entity = entity.withType(request.type);
      }
      if (request.results !== undefined) {
        entity = entity.withResults(request.results);
      }
      if (request.sortOrder !== undefined) {
        entity = entity.withSortOrder(request.sortOrder);
      }
      const updateResult = await this._repository.update(entity.toData());
      if (!updateResult.isSuccess) {
        return ResultEx.failure(updateResult.error);
      }
      this._logger.info('update-round.success', { projectId: request.projectId, roundId: request.roundId });
      return ResultEx.success(toViewDTO(updateResult.data));
    } catch (error) {
      this._logger.error('update-round.error', { projectId: request.projectId, roundId: request.roundId, error });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }
}
