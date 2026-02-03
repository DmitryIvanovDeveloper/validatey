import type { MarketContextSuggestion } from '../../ports/market-context-llm.port';

export type SuggestMarketContextRequest = {
  segmentDescription: string;
  segmentDemographics?: string;
  productDescription?: string;
};

export type SuggestMarketContextResponse = MarketContextSuggestion;
