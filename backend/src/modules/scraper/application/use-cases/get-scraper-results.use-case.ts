import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { TYPES as SCRAPER_TYPES } from '../../infrastructure/bootstrap/types';
import type { ScraperRunRepositoryPort } from '../ports/scraper-run-repository.port';
import type { ScraperSourceRepositoryPort } from '../ports/scraper-source-repository.port';
import { ScraperNotFoundError } from '../../domain/errors/scraper.error';
import type { GetScraperResultsRequest, GetScraperResultsResponse } from './input-output/scraper.io';

@injectable()
export class GetScraperResultsUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(SCRAPER_TYPES.ScraperRunRepository)
    private readonly _runRepository: ScraperRunRepositoryPort,
    @inject(SCRAPER_TYPES.ScraperSourceRepository)
    private readonly _sourceRepository: ScraperSourceRepositoryPort
  ) {}

  async execute(
    request: GetScraperResultsRequest
  ): Promise<ResultEx<GetScraperResultsResponse, ScraperNotFoundError | Error>> {
    this._logger.info('get-scraper-results.start', {
      projectId: request.projectId,
      scraperSourceId: request.scraperSourceId,
    });

    if (request.scraperSourceId) {
      const sourceResult = await this._sourceRepository.findById(request.scraperSourceId);
      if (!sourceResult.isSuccess) {
        return ResultEx.failure(sourceResult.error);
      }
      const source = sourceResult.data;
      if (!source || source.projectId !== request.projectId) {
        return ResultEx.failure(new ScraperNotFoundError(request.scraperSourceId));
      }
      const runsResult = await this._runRepository.findByScraperSourceId(
        request.scraperSourceId,
        request.limit ?? 50
      );
      if (!runsResult.isSuccess) {
        return ResultEx.failure(runsResult.error);
      }
      return ResultEx.success({ runs: runsResult.data });
    }

    const runsResult = await this._runRepository.findLatestByProjectId(
      request.projectId,
      request.limit ?? 50
    );
    if (!runsResult.isSuccess) {
      return ResultEx.failure(runsResult.error);
    }
    return ResultEx.success({ runs: runsResult.data });
  }
}
