import { injectable, inject } from 'inversify';
import { TYPES } from '../../infrastructure/bootstrap/types';
import type { ScraperApiPort, AddSourceParams, ScraperSuggestion } from '../../application/ports/scraper-api.port';
import type { ScraperSource } from '../../domain/entities/scraper-source.entity';
import type { ScraperRun } from '../../domain/entities/scraper-run.entity';

@injectable()
export class ScraperPresenter {
  readonly labels = {
    backToProject: 'Back to project',
    back: 'Back',
    dataSources: 'Data sources',
    dataSourcesSubtitle: 'Collect prices, reviews, and trends from the web',
    addSource: 'Add source',
    keyInsightsTitle: 'Key insights from your data',
    projectLabel: 'Project:',
    sources: 'Sources',
    runs: 'Runs',
    insights: 'Insights',
    aiAssistTitle: "Don't know what to parse? AI will help",
  };

  constructor(
    @inject(TYPES.ScraperApi)
    private readonly _api: ScraperApiPort
  ) {}

  async listSources(projectId: string): Promise<ScraperSource[]> {
    return this._api.listSources(projectId);
  }

  async getResults(projectId: string, options?: { scraperSourceId?: string; limit?: number }): Promise<ScraperRun[]> {
    return this._api.getResults(projectId, options);
  }

  async getStats(projectId: string) {
    return this._api.getStats(projectId);
  }

  async getPresets(projectId: string) {
    return this._api.getPresets(projectId);
  }

  async addSource(projectId: string, params: AddSourceParams): Promise<ScraperSource> {
    return this._api.addSource(projectId, params);
  }

  async updateSource(
    projectId: string,
    sourceId: string,
    params: Partial<AddSourceParams>
  ): Promise<ScraperSource> {
    return this._api.updateSource(projectId, sourceId, params);
  }

  async deleteSource(projectId: string, sourceId: string): Promise<void> {
    return this._api.deleteSource(projectId, sourceId);
  }

  async runScraper(projectId: string, sourceId: string): Promise<ScraperRun> {
    return this._api.runScraper(projectId, sourceId);
  }

  async suggest(
    projectId: string,
    message: string,
    projectContext?: { name?: string; description?: string }
  ): Promise<ScraperSuggestion> {
    return this._api.suggest(projectId, message, projectContext);
  }

  async generateInsights(projectId: string, runId: string): Promise<ScraperRun> {
    return this._api.generateInsights(projectId, runId);
  }
}
