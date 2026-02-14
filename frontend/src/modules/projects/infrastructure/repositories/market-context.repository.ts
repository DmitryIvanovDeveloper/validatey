import { injectable, inject } from 'inversify';
import type { MarketContextRepositoryPort } from '../../application/ports/market-context-repository.port';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import { API_CONFIG } from '../../../../infrastructure/config/api.config';
import Result from '../../../../infrastructure/result/result';
import { GetMarketContextSuggestionRequest, GetMarketContextSuggestionResponse } from '../../application/use-cases/input-output/get-market-context-suggestion.io';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';

@injectable()
export class MarketContextRepository implements MarketContextRepositoryPort {
  constructor(
    @inject(ROOT_TYPES.HttpClient)
    private readonly _httpClient: HttpClientPort
  ) {}

  async getSuggestions(request: GetMarketContextSuggestionRequest): Promise<Result<GetMarketContextSuggestionResponse, Error>> {
    try {
      const response = await this._httpClient.post<GetMarketContextSuggestionResponse>(
        API_CONFIG.ENDPOINTS.AI_MARKET_CONTEXT_SUGGEST,
        {
          segmentDescription: request.segmentDescription,
          segmentDemographics: request.segmentDemographics,
          productDescription: request.productDescription,
        }
      );

      return Result.success(response);
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error('Network error'));
    }
  }
}