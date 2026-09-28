import ResultEx from "../../../../infrastructure/result/result";
import type { ScraperSourceRepositoryPort } from "../ports/scraper-source-repository.port";
import { ScraperSourceEntity } from "../../domain/entities/scraper-source.entity";
import {
  InvalidScraperConfigError,
  ScraperNotFoundError,
  ScraperValidationError,
} from "../../domain/errors/scraper.error";
import type { UpdateScraperSourceRequest, UpdateScraperSourceResponse } from "./input-output/scraper-source.io";

export class UpdateScraperSourceUseCase {
  constructor(private readonly repository: ScraperSourceRepositoryPort) {}

  async execute(
    request: UpdateScraperSourceRequest,
  ): Promise<ResultEx<UpdateScraperSourceResponse, InvalidScraperConfigError | ScraperNotFoundError | ScraperValidationError | Error>> {
    try {
      const existingResult = await this.repository.findById(request.id);
      if (!existingResult.isSuccess) return ResultEx.failure(existingResult.error);
      const existing = existingResult.data;
      if (!existing || existing.projectId !== request.projectId) return ResultEx.failure(new ScraperNotFoundError(request.id));

      const updated = ScraperSourceEntity.merge(existing, {
        name: request.name,
        researchGoal: request.researchGoal,
        urls: request.urls,
        whatToCollect: request.whatToCollect,
        frequency: request.frequency,
        aiProcessing: request.aiProcessing,
        customSelectors: request.customSelectors,
        stopOnFirstError: request.stopOnFirstError,
      }).toData();

      if (updated.type === "custom") {
        const hasSelectors =
          updated.customSelectors?.selectors &&
          typeof updated.customSelectors.selectors === "object" &&
          Object.keys(updated.customSelectors.selectors).length > 0;
        if (!hasSelectors) {
          return ResultEx.failure(
            new ScraperValidationError("Validation failed", {
              customSelectors: 'Custom selectors are required for type "Custom parsing". Add at least one selector (e.g. container, title).',
            }),
          );
        }
      }

      const result = await this.repository.update(updated);
      if (!result.isSuccess) return ResultEx.failure(result.error);
      return ResultEx.success({ source: result.data });
    } catch (err) {
      if (err instanceof InvalidScraperConfigError || err instanceof ScraperNotFoundError || err instanceof ScraperValidationError) {
        return ResultEx.failure(err);
      }
      return ResultEx.failure(err instanceof Error ? err : new Error("Unknown error"));
    }
  }
}
