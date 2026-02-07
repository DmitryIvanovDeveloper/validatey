import { Container } from 'inversify';
import { TYPES } from './types';
import type { ScraperSourceRepositoryPort } from '../../application/ports/scraper-source-repository.port';
import type { ScraperRunRepositoryPort } from '../../application/ports/scraper-run-repository.port';
import type { WebScraperPort } from '../../application/ports/web-scraper.port';
import type { FetchHtmlPort } from '../../application/ports/fetch-html.port';
import type { ScraperSuggestLlmPort } from '../../application/ports/scraper-suggest-llm.port';
import type { ScraperInsightsLlmPort } from '../../application/ports/scraper-insights-llm.port';
import { SupabaseScraperSourceRepository } from '../repositories/supabase-scraper-source.repository';
import { SupabaseScraperRunRepository } from '../repositories/supabase-scraper-run.repository';
import { FetchHtmlAdapter } from '../services/fetch-html.adapter';
import { FetchHtmlBrowserAdapter } from '../services/fetch-html-browser.adapter';
import { FetchHtmlWithRetryAdapter } from '../services/fetch-html-retry.adapter';
import { WebScraperRealAdapter } from '../services/web-scraper-real.adapter';
import { ScraperSuggestLlmAdapter } from '../services/scraper-suggest-llm.adapter';
import { ScraperInsightsLlmAdapter } from '../services/scraper-insights-llm.adapter';
import { AddScraperSourceUseCase } from '../../application/use-cases/add-scraper-source.use-case';
import { UpdateScraperSourceUseCase } from '../../application/use-cases/update-scraper-source.use-case';
import { DeleteScraperSourceUseCase } from '../../application/use-cases/delete-scraper-source.use-case';
import { ListScraperSourcesUseCase } from '../../application/use-cases/list-scraper-sources.use-case';
import { RunScraperUseCase } from '../../application/use-cases/run-scraper.use-case';
import { GetScraperResultsUseCase } from '../../application/use-cases/get-scraper-results.use-case';
import { SuggestScraperUseCase } from '../../application/use-cases/suggest-scraper.use-case';
import { GenerateRunInsightsUseCase } from '../../application/use-cases/generate-run-insights.use-case';
import { GetScraperStatsUseCase } from '../../application/use-cases/get-scraper-stats.use-case';
import { GetScraperDashboardMetricsUseCase } from '../../application/use-cases/get-scraper-dashboard-metrics.use-case';
import { ScraperController } from '../../interface-adapters/controllers/scraper.controller';

export function bindScraper(container: Container): void {
  container
    .bind<ScraperSourceRepositoryPort>(TYPES.ScraperSourceRepository)
    .to(SupabaseScraperSourceRepository);
  container
    .bind<ScraperRunRepositoryPort>(TYPES.ScraperRunRepository)
    .to(SupabaseScraperRunRepository);
  const useBrowserFetch = process.env.SCRAPER_FETCH_HTML !== 'fetch';
  container
    .bind<FetchHtmlPort>(TYPES.FetchHtmlInner)
    .to(useBrowserFetch ? FetchHtmlBrowserAdapter : FetchHtmlAdapter);
  container.bind<FetchHtmlPort>(TYPES.FetchHtml).to(FetchHtmlWithRetryAdapter);
  container.bind<WebScraperPort>(TYPES.WebScraper).to(WebScraperRealAdapter);
  container
    .bind<ScraperSuggestLlmPort>(TYPES.ScraperSuggestLlm)
    .to(ScraperSuggestLlmAdapter);
  container
    .bind<ScraperInsightsLlmPort>(TYPES.ScraperInsightsLlm)
    .to(ScraperInsightsLlmAdapter);
  container.bind<AddScraperSourceUseCase>(TYPES.AddScraperSourceUseCase).to(AddScraperSourceUseCase);
  container
    .bind<UpdateScraperSourceUseCase>(TYPES.UpdateScraperSourceUseCase)
    .to(UpdateScraperSourceUseCase);
  container
    .bind<DeleteScraperSourceUseCase>(TYPES.DeleteScraperSourceUseCase)
    .to(DeleteScraperSourceUseCase);
  container
    .bind<ListScraperSourcesUseCase>(TYPES.ListScraperSourcesUseCase)
    .to(ListScraperSourcesUseCase);
  container.bind<RunScraperUseCase>(TYPES.RunScraperUseCase).to(RunScraperUseCase);
  container
    .bind<GetScraperResultsUseCase>(TYPES.GetScraperResultsUseCase)
    .to(GetScraperResultsUseCase);
  container
    .bind<SuggestScraperUseCase>(TYPES.SuggestScraperUseCase)
    .to(SuggestScraperUseCase);
  container
    .bind<GenerateRunInsightsUseCase>(TYPES.GenerateRunInsightsUseCase)
    .to(GenerateRunInsightsUseCase);
  container
    .bind<GetScraperStatsUseCase>(TYPES.GetScraperStatsUseCase)
    .to(GetScraperStatsUseCase);
  container
    .bind<GetScraperDashboardMetricsUseCase>(TYPES.GetScraperDashboardMetricsUseCase)
    .to(GetScraperDashboardMetricsUseCase);
  container.bind<ScraperController>(TYPES.ScraperController).to(ScraperController);
}
