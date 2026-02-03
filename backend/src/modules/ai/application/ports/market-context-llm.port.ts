import ResultEx from '../../../../infrastructure/result/result';
import { AiModuleError } from '../../domain/errors/ai.error';

export interface MarketContextSuggestion {
  readonly marketPicture: string;
  readonly marketFit: string;
  readonly differentiation: string;
}

export interface MarketContextLlmSynthesizeInput {
  readonly segmentDescription: string;
  readonly segmentDemographics?: string;
  readonly productDescription?: string;
  readonly searchSnippets: readonly string[];
}

export interface MarketContextLlmPort {
  synthesize(input: MarketContextLlmSynthesizeInput): Promise<ResultEx<MarketContextSuggestion, AiModuleError>>;
}
