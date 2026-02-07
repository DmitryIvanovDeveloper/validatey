import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { TYPES as ROUNDS_TYPES } from '../../infrastructure/bootstrap/types';
import type { RoundRepositoryPort } from '../ports/round-repository.port';
import type { ListRoundsByProjectRequest, RoundViewDTO } from './input-output/round.io';

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
export class ListRoundsByProjectUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(ROUNDS_TYPES.RoundRepository)
    private readonly _repository: RoundRepositoryPort
  ) {}

  async execute(
    request: ListRoundsByProjectRequest
  ): Promise<ResultEx<RoundViewDTO[], Error>> {
    this._logger.info('list-rounds-by-project.start', { projectId: request.projectId });

    try {
      const result = await this._repository.findByProjectId(request.projectId);
      if (!result.isSuccess) {
        return ResultEx.failure(result.error);
      }
      const sorted = [...result.data].sort(
        (a, b) => a.sortOrder - b.sortOrder || a.createdAt.getTime() - b.createdAt.getTime()
      );
      this._logger.info('list-rounds-by-project.success', { projectId: request.projectId, count: sorted.length });
      return ResultEx.success(sorted.map(toViewDTO));
    } catch (error) {
      this._logger.error('list-rounds-by-project.error', { projectId: request.projectId, error });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }
}
