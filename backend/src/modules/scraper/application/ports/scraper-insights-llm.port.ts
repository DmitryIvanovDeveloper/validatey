import ResultEx from '../../../../infrastructure/result/result';

export interface ScraperInsightsLlmInput {
  rawResult: Record<string, unknown>;
  sourceType?: string;
  researchGoal?: string | null;
}

export interface ScraperInsightsLlmPort {
  generateInsights(input: ScraperInsightsLlmInput): Promise<ResultEx<string, Error>>;
}
