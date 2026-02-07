import { injectable, inject } from 'inversify';
import { TYPES } from '../../infrastructure/bootstrap/types';
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
import type {
  AddScraperSourceRequest,
  AddScraperSourceResponse,
  UpdateScraperSourceRequest,
  UpdateScraperSourceResponse,
  ListScraperSourcesRequest,
  ListScraperSourcesResponse,
  DeleteScraperSourceRequest,
  RunScraperRequest,
  RunScraperResponse,
  GetScraperResultsRequest,
  GetScraperResultsResponse,
  SuggestScraperRequest,
  SuggestScraperResponse,
  GenerateRunInsightsRequest,
  GenerateRunInsightsResponse,
  GetScraperStatsRequest,
  GetScraperStatsResponse,
  GetScraperDashboardMetricsRequest,
  GetScraperDashboardMetricsResponse,
} from '../../application/use-cases/input-output/scraper.io';
import ResultEx from '../../../../infrastructure/result/result';

@injectable()
export class ScraperController {
  constructor(
    @inject(TYPES.AddScraperSourceUseCase)
    private readonly _addScraperSourceUseCase: AddScraperSourceUseCase,
    @inject(TYPES.UpdateScraperSourceUseCase)
    private readonly _updateScraperSourceUseCase: UpdateScraperSourceUseCase,
    @inject(TYPES.DeleteScraperSourceUseCase)
    private readonly _deleteScraperSourceUseCase: DeleteScraperSourceUseCase,
    @inject(TYPES.ListScraperSourcesUseCase)
    private readonly _listScraperSourcesUseCase: ListScraperSourcesUseCase,
    @inject(TYPES.RunScraperUseCase)
    private readonly _runScraperUseCase: RunScraperUseCase,
    @inject(TYPES.GetScraperResultsUseCase)
    private readonly _getScraperResultsUseCase: GetScraperResultsUseCase,
    @inject(TYPES.SuggestScraperUseCase)
    private readonly _suggestScraperUseCase: SuggestScraperUseCase,
    @inject(TYPES.GenerateRunInsightsUseCase)
    private readonly _generateRunInsightsUseCase: GenerateRunInsightsUseCase,
    @inject(TYPES.GetScraperStatsUseCase)
    private readonly _getScraperStatsUseCase: GetScraperStatsUseCase,
    @inject(TYPES.GetScraperDashboardMetricsUseCase)
    private readonly _getScraperDashboardMetricsUseCase: GetScraperDashboardMetricsUseCase
  ) {}

  async addSource(
    request: AddScraperSourceRequest
  ): Promise<ResultEx<AddScraperSourceResponse, Error>> {
    return this._addScraperSourceUseCase.execute(request);
  }

  async updateSource(
    request: UpdateScraperSourceRequest
  ): Promise<ResultEx<UpdateScraperSourceResponse, Error>> {
    return this._updateScraperSourceUseCase.execute(request);
  }

  async deleteSource(request: DeleteScraperSourceRequest): Promise<ResultEx<void, Error>> {
    return this._deleteScraperSourceUseCase.execute(request);
  }

  async listSources(
    request: ListScraperSourcesRequest
  ): Promise<ResultEx<ListScraperSourcesResponse, Error>> {
    return this._listScraperSourcesUseCase.execute(request);
  }

  async runScraper(request: RunScraperRequest): Promise<ResultEx<RunScraperResponse, Error>> {
    return this._runScraperUseCase.execute(request);
  }

  async getResults(
    request: GetScraperResultsRequest
  ): Promise<ResultEx<GetScraperResultsResponse, Error>> {
    return this._getScraperResultsUseCase.execute(request);
  }

  async suggest(
    request: SuggestScraperRequest
  ): Promise<ResultEx<SuggestScraperResponse, Error>> {
    return this._suggestScraperUseCase.execute(request);
  }

  async generateRunInsights(
    request: GenerateRunInsightsRequest
  ): Promise<ResultEx<GenerateRunInsightsResponse, Error>> {
    return this._generateRunInsightsUseCase.execute(request);
  }

  async getStats(
    request: GetScraperStatsRequest
  ): Promise<ResultEx<GetScraperStatsResponse, Error>> {
    return this._getScraperStatsUseCase.execute(request);
  }

  async getDashboardMetrics(
    request: GetScraperDashboardMetricsRequest
  ): Promise<ResultEx<GetScraperDashboardMetricsResponse, Error>> {
    return this._getScraperDashboardMetricsUseCase.execute(request);
  }
}
