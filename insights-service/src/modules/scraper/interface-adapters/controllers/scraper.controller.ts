import { AddScraperSourceUseCase } from "../../application/use-cases/add-scraper-source.use-case";
import { UpdateScraperSourceUseCase } from "../../application/use-cases/update-scraper-source.use-case";
import { DeleteScraperSourceUseCase } from "../../application/use-cases/delete-scraper-source.use-case";
import { ListScraperSourcesUseCase } from "../../application/use-cases/list-scraper-sources.use-case";
import { RunScraperUseCase } from "../../application/use-cases/run-scraper.use-case";
import { GetScraperResultsUseCase } from "../../application/use-cases/get-scraper-results.use-case";
import { SuggestScraperUseCase } from "../../application/use-cases/suggest-scraper.use-case";
import { GenerateRunInsightsUseCase } from "../../application/use-cases/generate-run-insights.use-case";
import { GetScraperStatsUseCase } from "../../application/use-cases/get-scraper-stats.use-case";
import { GetScraperDashboardMetricsUseCase } from "../../application/use-cases/get-scraper-dashboard-metrics.use-case";
import type {
  AddScraperSourceRequest,
  DeleteScraperSourceRequest,
  ListScraperSourcesRequest,
  UpdateScraperSourceRequest,
  RunScraperRequest,
  GetScraperResultsRequest,
  SuggestScraperRequest,
  GenerateRunInsightsRequest,
  GetScraperStatsRequest,
  GetScraperDashboardMetricsRequest,
} from "../../application/use-cases/input-output/scraper-source.io";
import { RESEARCH_GOAL_LABELS, RESEARCH_GOAL_PRESETS } from "../../domain/value-objects/research-goal.vo";

export class ScraperController {
  constructor(
    private readonly addScraperSourceUseCase: AddScraperSourceUseCase,
    private readonly updateScraperSourceUseCase: UpdateScraperSourceUseCase,
    private readonly deleteScraperSourceUseCase: DeleteScraperSourceUseCase,
    private readonly listScraperSourcesUseCase: ListScraperSourcesUseCase,
    private readonly runScraperUseCase: RunScraperUseCase,
    private readonly getScraperResultsUseCase: GetScraperResultsUseCase,
    private readonly suggestScraperUseCase: SuggestScraperUseCase,
    private readonly generateRunInsightsUseCase: GenerateRunInsightsUseCase,
    private readonly getScraperStatsUseCase: GetScraperStatsUseCase,
    private readonly getScraperDashboardMetricsUseCase: GetScraperDashboardMetricsUseCase,
  ) {}

  async addSource(input: AddScraperSourceRequest) {
    return this.addScraperSourceUseCase.execute(input);
  }

  async updateSource(input: UpdateScraperSourceRequest) {
    return this.updateScraperSourceUseCase.execute(input);
  }

  async deleteSource(input: DeleteScraperSourceRequest) {
    return this.deleteScraperSourceUseCase.execute(input);
  }

  async listSources(input: ListScraperSourcesRequest) {
    return this.listScraperSourcesUseCase.execute(input);
  }

  async runScraper(input: RunScraperRequest) {
    return this.runScraperUseCase.execute(input);
  }

  async getResults(input: GetScraperResultsRequest) {
    return this.getScraperResultsUseCase.execute(input);
  }

  async suggest(input: SuggestScraperRequest) {
    return this.suggestScraperUseCase.execute(input);
  }

  async generateRunInsights(input: GenerateRunInsightsRequest) {
    return this.generateRunInsightsUseCase.execute(input);
  }

  async getStats(input: GetScraperStatsRequest) {
    return this.getScraperStatsUseCase.execute(input);
  }

  async getDashboardMetrics(input: GetScraperDashboardMetricsRequest) {
    return this.getScraperDashboardMetricsUseCase.execute(input);
  }

  getPresets() {
    return {
      labels: RESEARCH_GOAL_LABELS,
      presets: RESEARCH_GOAL_PRESETS,
    };
  }
}
