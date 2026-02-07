import { injectable, inject } from 'inversify';
import { TYPES as SCRAPER_TYPES } from '../../infrastructure/bootstrap/types';
import type { ScraperRunRepositoryPort } from '../ports/scraper-run-repository.port';
import type {
  GetScraperDashboardMetricsRequest,
  GetScraperDashboardMetricsResponse,
} from './input-output/scraper.io';
import ResultEx from '../../../../infrastructure/result/result';

@injectable()
export class GetScraperDashboardMetricsUseCase {
  constructor(
    @inject(SCRAPER_TYPES.ScraperRunRepository)
    private readonly _runRepository: ScraperRunRepositoryPort
  ) {}

  async execute(
    request: GetScraperDashboardMetricsRequest
  ): Promise<ResultEx<GetScraperDashboardMetricsResponse, Error>> {
    const limit = request.limit ?? 100;
    const runsResult = await this._runRepository.findLatestByProjectId(request.projectId, limit);
    if (!runsResult.isSuccess) {
      return ResultEx.failure(runsResult.error);
    }
    const runs = runsResult.data;
    const withStats = runs.filter((r) => r.stats != null);
    const statsList = withStats.map((r) => r.stats!);

    const totalRuns = runs.length;
    const totalUrlsSuccess = statsList.reduce((s, st) => s + st.urlsSuccess, 0);
    const totalUrlsWithItems = statsList.reduce((s, st) => s + st.urlsWithItems, 0);
    const totalItems = statsList.reduce((s, st) => s + st.totalItems, 0);
    const sumAvg =
      statsList.length > 0
        ? statsList.reduce((s, st) => s + st.avgItemsPerUrl, 0) / statsList.length
        : 0;

    const response: GetScraperDashboardMetricsResponse = {
      runsWithStats: withStats.length,
      aggregate: {
        totalRuns,
        totalUrlsSuccess,
        totalUrlsWithItems,
        totalItems,
        avgItemsPerUrl: Math.round(sumAvg * 100) / 100,
      },
      recentRuns: runs.slice(0, 20).map((r) => ({
        runId: r.id,
        status: r.status,
        stats: r.stats ?? null,
      })),
    };
    return ResultEx.success(response);
  }
}
