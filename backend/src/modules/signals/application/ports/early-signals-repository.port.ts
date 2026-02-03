import ResultEx from '../../../../infrastructure/result/result';
import { EarlySignal } from '../../domain/entities/early-signal.entity';

export interface EarlySignalsRepositoryPort {
  save(projectId: string, signals: EarlySignal[]): Promise<ResultEx<void, Error>>;
  findByProjectId(projectId: string): Promise<ResultEx<EarlySignal[], Error>>;
}
