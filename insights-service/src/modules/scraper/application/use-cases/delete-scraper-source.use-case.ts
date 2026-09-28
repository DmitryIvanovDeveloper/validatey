import ResultEx from "../../../../infrastructure/result/result";
import type { ScraperSourceRepositoryPort } from "../ports/scraper-source-repository.port";
import { ScraperNotFoundError } from "../../domain/errors/scraper.error";
import type { DeleteScraperSourceRequest } from "./input-output/scraper-source.io";

export class DeleteScraperSourceUseCase {
  constructor(private readonly repository: ScraperSourceRepositoryPort) {}

  async execute(request: DeleteScraperSourceRequest): Promise<ResultEx<void, ScraperNotFoundError | Error>> {
    const result = await this.repository.delete(request.id, request.projectId);
    if (!result.isSuccess) return ResultEx.failure(result.error);
    return ResultEx.success(undefined);
  }
}
