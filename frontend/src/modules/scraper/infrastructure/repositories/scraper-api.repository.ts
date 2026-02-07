import { injectable, inject } from 'inversify';
import { API_CONFIG } from '../../../../infrastructure/config/api.config';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type {
  ScraperApiPort,
  AddSourceParams,
  ScraperStats,
  ScraperPresets,
  ScraperSuggestion,
} from '../../application/ports/scraper-api.port';
import type { ScraperSource } from '../../domain/entities/scraper-source.entity';
import type { ScraperRun } from '../../domain/entities/scraper-run.entity';

@injectable()
export class ScraperApiRepository implements ScraperApiPort {
  constructor(
    @inject(ROOT_TYPES.HttpClient)
    private readonly _http: HttpClientPort
  ) {}

  async listSources(projectId: string): Promise<ScraperSource[]> {
    const data = await this._http.get<{ sources: ScraperSource[] }>(
      API_CONFIG.ENDPOINTS.SCRAPER_SOURCES(projectId)
    );
    return data?.sources ?? [];
  }

  async addSource(projectId: string, params: AddSourceParams): Promise<ScraperSource> {
    const data = await this._http.post<{ source: ScraperSource }>(
      API_CONFIG.ENDPOINTS.SCRAPER_SOURCES(projectId),
      {
        type: params.type,
        name: params.name ?? null,
        researchGoal: params.researchGoal ?? undefined,
        urls: params.urls,
        whatToCollect: params.whatToCollect,
        frequency: params.frequency,
        aiProcessing: params.aiProcessing ?? 'none',
      }
    );
    if (!data?.source) throw new Error('Invalid response');
    return data.source;
  }

  async updateSource(
    projectId: string,
    sourceId: string,
    params: Partial<AddSourceParams>
  ): Promise<ScraperSource> {
    const data = await this._http.patch<{ source: ScraperSource }>(
      API_CONFIG.ENDPOINTS.SCRAPER_SOURCE(projectId, sourceId),
      params
    );
    if (!data?.source) throw new Error('Invalid response');
    return data.source;
  }

  async deleteSource(projectId: string, sourceId: string): Promise<void> {
    await this._http.delete(API_CONFIG.ENDPOINTS.SCRAPER_SOURCE(projectId, sourceId));
  }

  async runScraper(projectId: string, sourceId: string): Promise<ScraperRun> {
    const data = await this._http.post<{ run: ScraperRun }>(
      API_CONFIG.ENDPOINTS.SCRAPER_RUN(projectId, sourceId),
      {}
    );
    if (!data?.run) throw new Error('Invalid response');
    return data.run;
  }

  async getResults(
    projectId: string,
    options?: { scraperSourceId?: string; limit?: number }
  ): Promise<ScraperRun[]> {
    const q = new URLSearchParams();
    if (options?.scraperSourceId) q.set('scraperSourceId', options.scraperSourceId);
    if (options?.limit != null) q.set('limit', String(options.limit));
    const suffix = q.toString() ? `?${q.toString()}` : '';
    const data = await this._http.get<{ runs: ScraperRun[] }>(
      API_CONFIG.ENDPOINTS.SCRAPER_RESULTS(projectId) + suffix
    );
    return data?.runs ?? [];
  }

  async getStats(projectId: string): Promise<ScraperStats> {
    const data = await this._http.get<ScraperStats>(
      API_CONFIG.ENDPOINTS.SCRAPER_STATS(projectId)
    );
    if (!data) throw new Error('Invalid response');
    return {
      sourcesCount: data.sourcesCount ?? 0,
      runsCount: data.runsCount ?? 0,
      runsWithInsightsCount: data.runsWithInsightsCount ?? 0,
    };
  }

  async getPresets(projectId: string): Promise<ScraperPresets | null> {
    try {
      const data = await this._http.get<ScraperPresets>(
        API_CONFIG.ENDPOINTS.SCRAPER_PRESETS(projectId)
      );
      return data?.labels && data?.presets ? data : null;
    } catch {
      return null;
    }
  }

  async suggest(
    projectId: string,
    message: string,
    projectContext?: { name?: string; description?: string }
  ): Promise<ScraperSuggestion> {
    const data = await this._http.post<{ suggestion: ScraperSuggestion }>(
      API_CONFIG.ENDPOINTS.SCRAPER_SUGGEST(projectId),
      { message, projectContext }
    );
    if (!data?.suggestion) throw new Error('Invalid response');
    return data.suggestion;
  }

  async generateInsights(projectId: string, runId: string): Promise<ScraperRun> {
    const data = await this._http.post<{ run: ScraperRun }>(
      API_CONFIG.ENDPOINTS.SCRAPER_GENERATE_INSIGHTS(projectId, runId),
      {}
    );
    if (!data?.run) throw new Error('Invalid response');
    return data.run;
  }
}
