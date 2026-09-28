import ResultEx from "../../../../infrastructure/result/result";
import type { ScraperSource } from "../../domain/entities/scraper-source.entity";
import type { ScraperNotFoundError } from "../../domain/errors/scraper.error";

export interface ScraperSourceRepositoryPort {
  create(source: ScraperSource): Promise<ResultEx<ScraperSource, Error>>;
  update(source: ScraperSource): Promise<ResultEx<ScraperSource, ScraperNotFoundError | Error>>;
  findById(id: string): Promise<ResultEx<ScraperSource | null, Error>>;
  findByProjectId(projectId: string): Promise<ResultEx<ScraperSource[], Error>>;
  delete(id: string, projectId: string): Promise<ResultEx<void, ScraperNotFoundError | Error>>;
}
