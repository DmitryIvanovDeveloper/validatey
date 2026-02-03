import ResultEx from '../../../../infrastructure/result/result';
import { AiModuleError } from '../../domain/errors/ai.error';

export interface TextFormattingPort {
  format(plainText: string): Promise<ResultEx<string, AiModuleError>>;
}
