import Result from '../../../../infrastructure/result/result';
import { GetMarketContextSuggestionRequest, GetMarketContextSuggestionResponse } from '../use-cases/input-output/get-market-context-suggestion.io';

export interface MarketContextRepositoryPort {
  getSuggestions(request: GetMarketContextSuggestionRequest): Promise<Result<GetMarketContextSuggestionResponse, Error>>;
}