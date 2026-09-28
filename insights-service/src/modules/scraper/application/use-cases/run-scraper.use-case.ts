import ResultEx from "../../../../infrastructure/result/result";
import type { ScraperRunRepositoryPort } from "../ports/scraper-run-repository.port";
import type { ScraperSourceRepositoryPort } from "../ports/scraper-source-repository.port";
import { createPendingRun } from "../../domain/entities/scraper-run.entity";
import type { RunScraperRequest, RunScraperResponse } from "./input-output/scraper-source.io";

export class RunScraperUseCase {
  constructor(
    private readonly runRepository: ScraperRunRepositoryPort,
    private readonly sourceRepository: ScraperSourceRepositoryPort,
  ) {}

  async execute(request: RunScraperRequest): Promise<ResultEx<RunScraperResponse, Error>> {
    const source = await this.sourceRepository.findById(request.scraperSourceId);
    if (!source.isSuccess) return ResultEx.failure(source.error);
    if (!source.data || source.data.projectId !== request.projectId) return ResultEx.failure(new Error("Scraper source not found"));
    const created = await this.runRepository.create(createPendingRun(request.scraperSourceId, request.projectId));
    if (!created.isSuccess) return ResultEx.failure(created.error);
    return ResultEx.success({ run: created.data });
  }
}
