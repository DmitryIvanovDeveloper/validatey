import ResultEx from '../../../../infrastructure/result/result';
import { EarlySignal } from '../../domain/entities/early-signal.entity';
import { EarlySignalsError } from '../../domain/errors/early-signals.error';

export interface EarlySignalsLlmPort {
  analyzeComments(
    comments: string[],
    hypothesis?: string
  ): Promise<ResultEx<EarlySignal[], EarlySignalsError>>;
}
