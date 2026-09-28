import ResultEx from "../../../../infrastructure/result/result";
import type { ScraperSourceRepositoryPort } from "../ports/scraper-source-repository.port";
import type { ListScraperSourcesRequest, ListScraperSourcesResponse } from "./input-output/scraper-source.io";

export class ListScraperSourcesUseCase {
  constructor(private readonly repository: ScraperSourceRepositoryPort) {}

  async execute(request: ListScraperSourcesRequest): Promise<ResultEx<ListScraperSourcesResponse, Error>> {
    const result = await this.repository.findByProjectId(request.projectId);
    if (!result.isSuccess) return ResultEx.failure(result.error);
    return ResultEx.success({ sources: result.data });
  }
}
