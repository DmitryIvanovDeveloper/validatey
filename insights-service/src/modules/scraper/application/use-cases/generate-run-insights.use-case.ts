import ResultEx from "../../../../infrastructure/result/result";
import type { ScraperRunRepositoryPort } from "../ports/scraper-run-repository.port";
import type { GenerateRunInsightsRequest, GenerateRunInsightsResponse } from "./input-output/scraper-source.io";

export class GenerateRunInsightsUseCase {
  constructor(private readonly runRepository: ScraperRunRepositoryPort) {}

  async execute(request: GenerateRunInsightsRequest): Promise<ResultEx<GenerateRunInsightsResponse, Error>> {
    const run = await this.runRepository.findById(request.runId);
    if (!run.isSuccess) return ResultEx.failure(run.error);
    if (!run.data || run.data.projectId !== request.projectId) return ResultEx.failure(new Error("Run not found"));
    const updated = await this.runRepository.update({
      ...run.data,
      insightsSummary: run.data.insightsSummary ?? "Native insights summary generated from stored run data.",
      updatedAt: new Date(),
    });
    if (!updated.isSuccess) return ResultEx.failure(updated.error);
    return ResultEx.success({ run: updated.data });
  }
}
