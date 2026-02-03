import { injectable, inject } from 'inversify';
import ResultEx from '../../../../infrastructure/result/result';
import { TextFormattingPort } from '../ports/text-formatting.port';
import { AiModuleError } from '../../domain/errors/ai.error';
import { FormatTextRequest, FormatTextResponse } from './input-output/format-text.io';
import { TYPES } from '../../infrastructure/bootstrap/types';

@injectable()
export class FormatTextUseCase {
  constructor(
    @inject(TYPES.TextFormattingPort)
    private readonly _formattingPort: TextFormattingPort
  ) {}

  async execute(request: FormatTextRequest): Promise<ResultEx<FormatTextResponse, AiModuleError>> {
    const text = (request.text ?? '').trim();
    if (!text) {
      return ResultEx.failure(new AiModuleError('Text is required'));
    }
    const result = await this._formattingPort.format(text);
    if (!result.isSuccess) {
      return ResultEx.failure(result.error);
    }
    return ResultEx.success({ formatted: result.data });
  }
}
