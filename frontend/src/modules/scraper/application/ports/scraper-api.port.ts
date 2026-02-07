import type { ScraperSource } from '../../domain/entities/scraper-source.entity';
import type { ScraperRun } from '../../domain/entities/scraper-run.entity';

export interface ScraperStats {
  sourcesCount: number;
  runsCount: number;
  runsWithInsightsCount: number;
}

export interface ScraperPresets {
  labels: Record<string, string>;
  presets: Record<string, { type: string; whatToCollect: string[]; frequency: string }>;
}

export interface ScraperSuggestion {
  type: string;
  name?: string | null;
  urls?: string[];
  whatToCollect: string[];
  frequency: string;
  researchGoal?: string | null;
}

export interface AddSourceParams {
  type: string;
  name?: string | null;
  researchGoal?: string | null;
  urls: string[];
  whatToCollect: string[];
  frequency: string;
  aiProcessing?: string;
}

export interface ScraperApiPort {
  listSources(projectId: string): Promise<ScraperSource[]>;
  addSource(projectId: string, params: AddSourceParams): Promise<ScraperSource>;
  updateSource(projectId: string, sourceId: string, params: Partial<AddSourceParams>): Promise<ScraperSource>;
  deleteSource(projectId: string, sourceId: string): Promise<void>;
  runScraper(projectId: string, sourceId: string): Promise<ScraperRun>;
  getResults(projectId: string, options?: { scraperSourceId?: string; limit?: number }): Promise<ScraperRun[]>;
  getStats(projectId: string): Promise<ScraperStats>;
  getPresets(projectId: string): Promise<ScraperPresets | null>;
  suggest(projectId: string, message: string, projectContext?: { name?: string; description?: string }): Promise<ScraperSuggestion>;
  generateInsights(projectId: string, runId: string): Promise<ScraperRun>;
}
