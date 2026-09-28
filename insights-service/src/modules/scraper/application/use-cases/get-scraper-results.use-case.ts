import ResultEx from "../../../../infrastructure/result/result";
import type { ScraperRunRepositoryPort } from "../ports/scraper-run-repository.port";
import type { GetScraperResultsRequest, GetScraperResultsResponse } from "./input-output/scraper-source.io";

export class GetScraperResultsUseCase {
  constructor(private readonly runRepository: ScraperRunRepositoryPort) {}

  async execute(request: GetScraperResultsRequest): Promise<ResultEx<GetScraperResultsResponse, Error>> {
    const result = request.scraperSourceId
      ? await this.runRepository.findByScraperSourceId(request.projectId, request.scraperSourceId, request.limit ?? 50)
      : await this.runRepository.findLatestByProjectId(request.projectId, request.limit ?? 50);
    if (!result.isSuccess) return ResultEx.failure(result.error);
    return ResultEx.success({ runs: result.data });
  }
}
