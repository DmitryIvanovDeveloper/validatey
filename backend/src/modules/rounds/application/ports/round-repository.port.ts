import ResultEx from '../../../../infrastructure/result/result';
import type { Round } from '../../domain/entities/round.entity';
import type { RoundNotFoundError, InvalidRoundDataError } from '../../domain/errors/round.error';

export interface RoundRepositoryPort {
  create(round: Round): Promise<ResultEx<Round, InvalidRoundDataError>>;
  findById(id: string): Promise<ResultEx<Round, RoundNotFoundError>>;
  findByProjectId(projectId: string): Promise<ResultEx<Round[], Error>>;
  update(round: Round): Promise<ResultEx<Round, RoundNotFoundError | InvalidRoundDataError>>;
  delete(id: string, projectId: string): Promise<ResultEx<void, RoundNotFoundError | Error>>;
}
