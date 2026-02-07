import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { TYPES as SCRAPER_TYPES } from '../../infrastructure/bootstrap/types';
import type { ScraperSourceRepositoryPort } from '../ports/scraper-source-repository.port';
import type { ScraperRunRepositoryPort } from '../ports/scraper-run-repository.port';
import type {
  GetScraperStatsRequest,
  GetScraperStatsResponse,
} from './input-output/scraper.io';

@injectable()
export class GetScraperStatsUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(SCRAPER_TYPES.ScraperSourceRepository)
    private readonly _sourceRepository: ScraperSourceRepositoryPort,
    @inject(SCRAPER_TYPES.ScraperRunRepository)
    private readonly _runRepository: ScraperRunRepositoryPort
  ) {}

  async execute(
    request: GetScraperStatsRequest
  ): Promise<ResultEx<GetScraperStatsResponse, Error>> {
    const [sourcesResult, runsResult] = await Promise.all([
      this._sourceRepository.findByProjectId(request.projectId),
      this._runRepository.findLatestByProjectId(request.projectId, 2000),
    ]);

    if (!sourcesResult.isSuccess) {
      return ResultEx.failure(sourcesResult.error);
    }
    if (!runsResult.isSuccess) {
      return ResultEx.failure(runsResult.error);
    }

    const sourcesCount = sourcesResult.data.length;
    const runs = runsResult.data;
    const runsCount = runs.length;
    const runsWithInsightsCount = runs.filter((r) => r.insightsSummary != null && r.insightsSummary.length > 0).length;

    return ResultEx.success({
      sourcesCount,
      runsCount,
      runsWithInsightsCount,
    });
  }
}
