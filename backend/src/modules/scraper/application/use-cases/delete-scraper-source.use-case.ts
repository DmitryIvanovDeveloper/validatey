import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { TYPES as SCRAPER_TYPES } from '../../infrastructure/bootstrap/types';
import type { ScraperSourceRepositoryPort } from '../ports/scraper-source-repository.port';
import { ScraperNotFoundError } from '../../domain/errors/scraper.error';
import type { DeleteScraperSourceRequest } from './input-output/scraper.io';

@injectable()
export class DeleteScraperSourceUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(SCRAPER_TYPES.ScraperSourceRepository)
    private readonly _repository: ScraperSourceRepositoryPort
  ) {}

  async execute(request: DeleteScraperSourceRequest): Promise<ResultEx<void, ScraperNotFoundError | Error>> {
    this._logger.info('delete-scraper-source.start', { id: request.id, projectId: request.projectId });

    const result = await this._repository.delete(request.id, request.projectId);
    if (!result.isSuccess) {
      return ResultEx.failure(result.error);
    }
    this._logger.info('delete-scraper-source.success', { id: request.id });
    return ResultEx.success(undefined);
  }
}
