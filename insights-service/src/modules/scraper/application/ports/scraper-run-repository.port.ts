import ResultEx from "../../../../infrastructure/result/result";
import type { ScraperRun } from "../../domain/entities/scraper-run.entity";

export interface ScraperRunRepositoryPort {
  create(run: ScraperRun): Promise<ResultEx<ScraperRun, Error>>;
  update(run: ScraperRun): Promise<ResultEx<ScraperRun, Error>>;
  findById(id: string): Promise<ResultEx<ScraperRun | null, Error>>;
  findByScraperSourceId(projectId: string, scraperSourceId: string, limit?: number): Promise<ResultEx<ScraperRun[], Error>>;
  findLatestByProjectId(projectId: string, limit?: number): Promise<ResultEx<ScraperRun[], Error>>;
}
