import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { TYPES as SCRAPER_TYPES } from '../../infrastructure/bootstrap/types';
import type { ScraperSuggestLlmPort } from '../ports/scraper-suggest-llm.port';
import type { SuggestScraperRequest, SuggestScraperResponse } from './input-output/scraper.io';

@injectable()
export class SuggestScraperUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(SCRAPER_TYPES.ScraperSuggestLlm)
    private readonly _llm: ScraperSuggestLlmPort
  ) {}

  async execute(
    request: SuggestScraperRequest
  ): Promise<ResultEx<SuggestScraperResponse, Error>> {
    this._logger.info('suggest-scraper.start', { projectId: request.projectId });

    const result = await this._llm.suggest({
      message: request.message,
      projectContext: request.projectContext,
    });

    if (!result.isSuccess) {
      this._logger.error('suggest-scraper.llm-error', { error: result.error.message });
      return ResultEx.failure(result.error);
    }

    this._logger.info('suggest-scraper.success', { type: result.data.type });
    return ResultEx.success({ suggestion: result.data });
  }
}
