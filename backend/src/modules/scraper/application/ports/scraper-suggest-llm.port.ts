import ResultEx from '../../../../infrastructure/result/result';
import type { ScraperSourceType } from '../../domain/value-objects/scraper-source-type.vo';
import type { ScheduleFrequency } from '../../domain/value-objects/schedule-frequency.vo';
import type { ResearchGoal } from '../../domain/value-objects/research-goal.vo';

export interface ScraperSuggestion {
  type: ScraperSourceType;
  name?: string | null;
  urls?: string[];
  whatToCollect: string[];
  frequency: ScheduleFrequency;
  researchGoal?: ResearchGoal | null;
}

export interface ScraperSuggestLlmInput {
  message: string;
  projectContext?: { name?: string; description?: string };
}

export interface ScraperSuggestLlmPort {
  suggest(input: ScraperSuggestLlmInput): Promise<ResultEx<ScraperSuggestion, Error>>;
}
