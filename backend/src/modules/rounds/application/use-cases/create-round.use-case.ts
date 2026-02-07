import { randomUUID } from 'crypto';
import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { TYPES as ROUNDS_TYPES } from '../../infrastructure/bootstrap/types';
import type { RoundRepositoryPort } from '../ports/round-repository.port';
import { RoundEntity } from '../../domain/entities/round.entity';
import type { InvalidRoundDataError } from '../../domain/errors/round.error';
import type { CreateRoundRequest, RoundViewDTO } from './input-output/round.io';

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
export class CreateRoundUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(ROUNDS_TYPES.RoundRepository)
    private readonly _repository: RoundRepositoryPort
  ) {}

  async execute(
    request: CreateRoundRequest
  ): Promise<ResultEx<RoundViewDTO, InvalidRoundDataError | Error>> {
    this._logger.info('create-round.start', { projectId: request.projectId, type: request.type });

    try {
      const id = randomUUID();
      const entity = RoundEntity.create({
        id,
        projectId: request.projectId,
        parentRoundId: request.parentRoundId ?? null,
        title: request.title,
        type: request.type,
        sortOrder: request.sortOrder ?? 0,
      });
      const result = await this._repository.create(entity.toData());
      if (!result.isSuccess) {
        return ResultEx.failure(result.error);
      }
      this._logger.info('create-round.success', { projectId: request.projectId, roundId: id });
      return ResultEx.success(toViewDTO(result.data));
    } catch (error) {
      this._logger.error('create-round.error', { projectId: request.projectId, error });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }
}
