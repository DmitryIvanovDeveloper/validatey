import ResultEx from "../../../../infrastructure/result/result";
import type { ScraperRunRepositoryPort } from "../ports/scraper-run-repository.port";
import type { GetScraperDashboardMetricsRequest, GetScraperDashboardMetricsResponse } from "./input-output/scraper-source.io";

export class GetScraperDashboardMetricsUseCase {
  constructor(private readonly runRepository: ScraperRunRepositoryPort) {}

  async execute(request: GetScraperDashboardMetricsRequest): Promise<ResultEx<GetScraperDashboardMetricsResponse, Error>> {
    const runs = await this.runRepository.findLatestByProjectId(request.projectId, request.limit ?? 50);
    if (!runs.isSuccess) return ResultEx.failure(runs.error);
    const withStats = runs.data.filter((x) => x.stats);
    const totalRuns = runs.data.length;
    const totalUrlsSuccess = withStats.reduce((acc, x) => acc + (x.stats?.urlsSuccess ?? 0), 0);
    const totalUrlsWithItems = withStats.reduce((acc, x) => acc + (x.stats?.urlsWithItems ?? 0), 0);
    const totalItems = withStats.reduce((acc, x) => acc + (x.stats?.totalItems ?? 0), 0);
    return ResultEx.success({
      runsWithStats: withStats.length,
      aggregate: {
        totalRuns,
        totalUrlsSuccess,
        totalUrlsWithItems,
        totalItems,
        avgItemsPerUrl: totalUrlsSuccess > 0 ? Math.round((totalItems / totalUrlsSuccess) * 100) / 100 : 0,
      },
      recentRuns: runs.data.slice(0, 10).map((run) => ({ runId: run.id, status: run.status, stats: run.stats })),
    });
  }
}
