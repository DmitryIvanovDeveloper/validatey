import ResultEx from "../../../../infrastructure/result/result";
import type { ScraperRunRepositoryPort } from "../ports/scraper-run-repository.port";
import type { ScraperSourceRepositoryPort } from "../ports/scraper-source-repository.port";
import type { GetScraperStatsRequest, GetScraperStatsResponse } from "./input-output/scraper-source.io";

export class GetScraperStatsUseCase {
  constructor(
    private readonly sourceRepository: ScraperSourceRepositoryPort,
    private readonly runRepository: ScraperRunRepositoryPort,
  ) {}

  async execute(request: GetScraperStatsRequest): Promise<ResultEx<GetScraperStatsResponse, Error>> {
    const [sources, runs] = await Promise.all([
      this.sourceRepository.findByProjectId(request.projectId),
      this.runRepository.findLatestByProjectId(request.projectId, 500),
    ]);
    if (!sources.isSuccess) return ResultEx.failure(sources.error);
    if (!runs.isSuccess) return ResultEx.failure(runs.error);
    return ResultEx.success({
      sourcesCount: sources.data.length,
      runsCount: runs.data.length,
      runsWithInsightsCount: runs.data.filter((r) => !!r.insightsSummary).length,
    });
  }
}
