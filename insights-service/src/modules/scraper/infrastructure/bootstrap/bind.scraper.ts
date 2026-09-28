import { Container } from "inversify";
import { TYPES } from "./types";
import { ScraperController } from "../../interface-adapters/controllers/scraper.controller";
import { SupabaseScraperSourceRepository } from "../repositories/supabase-scraper-source.repository";
import { AddScraperSourceUseCase } from "../../application/use-cases/add-scraper-source.use-case";
import { UpdateScraperSourceUseCase } from "../../application/use-cases/update-scraper-source.use-case";
import { DeleteScraperSourceUseCase } from "../../application/use-cases/delete-scraper-source.use-case";
import { ListScraperSourcesUseCase } from "../../application/use-cases/list-scraper-sources.use-case";
import { SupabaseScraperRunRepository } from "../repositories/supabase-scraper-run.repository";
import { RunScraperUseCase } from "../../application/use-cases/run-scraper.use-case";
import { GetScraperResultsUseCase } from "../../application/use-cases/get-scraper-results.use-case";
import { SuggestScraperUseCase } from "../../application/use-cases/suggest-scraper.use-case";
import { GenerateRunInsightsUseCase } from "../../application/use-cases/generate-run-insights.use-case";
import { GetScraperStatsUseCase } from "../../application/use-cases/get-scraper-stats.use-case";
import { GetScraperDashboardMetricsUseCase } from "../../application/use-cases/get-scraper-dashboard-metrics.use-case";

export function bindScraper(container: Container): void {
  container.bind(TYPES.ScraperSourceRepository).toConstantValue(new SupabaseScraperSourceRepository());
  container
    .bind(TYPES.AddScraperSourceUseCase)
    .toConstantValue(new AddScraperSourceUseCase(container.get(TYPES.ScraperSourceRepository)));
  container
    .bind(TYPES.UpdateScraperSourceUseCase)
    .toConstantValue(new UpdateScraperSourceUseCase(container.get(TYPES.ScraperSourceRepository)));
  container
    .bind(TYPES.DeleteScraperSourceUseCase)
    .toConstantValue(new DeleteScraperSourceUseCase(container.get(TYPES.ScraperSourceRepository)));
  container
    .bind(TYPES.ListScraperSourcesUseCase)
    .toConstantValue(new ListScraperSourcesUseCase(container.get(TYPES.ScraperSourceRepository)));
  container.bind(TYPES.ScraperRunRepository).toConstantValue(new SupabaseScraperRunRepository());
  container
    .bind(TYPES.RunScraperUseCase)
    .toConstantValue(new RunScraperUseCase(container.get(TYPES.ScraperRunRepository), container.get(TYPES.ScraperSourceRepository)));
  container
    .bind(TYPES.GetScraperResultsUseCase)
    .toConstantValue(new GetScraperResultsUseCase(container.get(TYPES.ScraperRunRepository)));
  container.bind(TYPES.SuggestScraperUseCase).toConstantValue(new SuggestScraperUseCase());
  container
    .bind(TYPES.GenerateRunInsightsUseCase)
    .toConstantValue(new GenerateRunInsightsUseCase(container.get(TYPES.ScraperRunRepository)));
  container
    .bind(TYPES.GetScraperStatsUseCase)
    .toConstantValue(new GetScraperStatsUseCase(container.get(TYPES.ScraperSourceRepository), container.get(TYPES.ScraperRunRepository)));
  container
    .bind(TYPES.GetScraperDashboardMetricsUseCase)
    .toConstantValue(new GetScraperDashboardMetricsUseCase(container.get(TYPES.ScraperRunRepository)));
  container.bind(TYPES.ScraperController).toConstantValue(
    new ScraperController(
      container.get(TYPES.AddScraperSourceUseCase),
      container.get(TYPES.UpdateScraperSourceUseCase),
      container.get(TYPES.DeleteScraperSourceUseCase),
      container.get(TYPES.ListScraperSourcesUseCase),
      container.get(TYPES.RunScraperUseCase),
      container.get(TYPES.GetScraperResultsUseCase),
      container.get(TYPES.SuggestScraperUseCase),
      container.get(TYPES.GenerateRunInsightsUseCase),
      container.get(TYPES.GetScraperStatsUseCase),
      container.get(TYPES.GetScraperDashboardMetricsUseCase),
    ),
  );
}
