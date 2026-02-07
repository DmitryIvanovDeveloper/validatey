import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { TYPES as SCRAPER_TYPES } from '../../infrastructure/bootstrap/types';
import type { ScraperSourceRepositoryPort } from '../ports/scraper-source-repository.port';
import type { ListScraperSourcesRequest, ListScraperSourcesResponse } from './input-output/scraper.io';

@injectable()
export class ListScraperSourcesUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(SCRAPER_TYPES.ScraperSourceRepository)
    private readonly _repository: ScraperSourceRepositoryPort
  ) {}

  async execute(
    request: ListScraperSourcesRequest
  ): Promise<ResultEx<ListScraperSourcesResponse, Error>> {
    this._logger.info('list-scraper-sources.start', { projectId: request.projectId });

    const result = await this._repository.findByProjectId(request.projectId);
    if (!result.isSuccess) {
      return ResultEx.failure(result.error);
    }
    return ResultEx.success({ sources: result.data });
  }
}
