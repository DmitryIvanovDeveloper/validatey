import type { ScraperSource, AiProcessingOption } from "../../../domain/entities/scraper-source.entity";
import type { ScraperRun } from "../../../domain/entities/scraper-run.entity";
import type { RunStats } from "../../../domain/value-objects/run-stats.vo";
import type { CustomSelectors } from "../../../domain/value-objects/custom-selectors.vo";
import type { ResearchGoal } from "../../../domain/value-objects/research-goal.vo";
import type { ScheduleFrequency } from "../../../domain/value-objects/schedule-frequency.vo";
import type { ScraperSourceType } from "../../../domain/value-objects/scraper-source-type.vo";

export type AddScraperSourceRequest = {
  projectId: string;
  type: ScraperSourceType;
  name?: string | null;
  researchGoal?: ResearchGoal | null;
  urls: string[];
  whatToCollect: string[];
  frequency: ScheduleFrequency;
  aiProcessing?: AiProcessingOption;
  customSelectors?: CustomSelectors | null;
  stopOnFirstError?: boolean;
};

export type AddScraperSourceResponse = { source: ScraperSource };
export type UpdateScraperSourceRequest = {
  id: string;
  projectId: string;
  name?: string | null;
  researchGoal?: ResearchGoal | null;
  urls?: string[];
  whatToCollect?: string[];
  frequency?: ScheduleFrequency;
  aiProcessing?: AiProcessingOption;
  customSelectors?: CustomSelectors | null;
  stopOnFirstError?: boolean;
};
export type UpdateScraperSourceResponse = { source: ScraperSource };
export type ListScraperSourcesRequest = { projectId: string };
export type ListScraperSourcesResponse = { sources: ScraperSource[] };
export type DeleteScraperSourceRequest = { id: string; projectId: string };
export type RunScraperRequest = { scraperSourceId: string; projectId: string };
export type RunScraperResponse = { run: ScraperRun };
export type GetScraperResultsRequest = { projectId: string; scraperSourceId?: string; limit?: number };
export type GetScraperResultsResponse = { runs: ScraperRun[] };
export type SuggestScraperRequest = {
  projectId: string;
  message: string;
  projectContext?: { name?: string; description?: string };
};
export type SuggestScraperResponse = {
  suggestion: {
    type: ScraperSourceType;
    urls: string[];
    whatToCollect: string[];
    frequency: ScheduleFrequency;
    aiProcessing: AiProcessingOption;
  };
};
export type GenerateRunInsightsRequest = { projectId: string; runId: string };
export type GenerateRunInsightsResponse = { run: ScraperRun };
export type GetScraperStatsRequest = { projectId: string };
export type GetScraperStatsResponse = { sourcesCount: number; runsCount: number; runsWithInsightsCount: number };
export type GetScraperDashboardMetricsRequest = { projectId: string; limit?: number };
export type GetScraperDashboardMetricsResponse = {
  runsWithStats: number;
  aggregate: {
    totalRuns: number;
    totalUrlsSuccess: number;
    totalUrlsWithItems: number;
    totalItems: number;
    avgItemsPerUrl: number;
  };
  recentRuns: Array<{ runId: string; status: string; stats: RunStats | null }>;
};
