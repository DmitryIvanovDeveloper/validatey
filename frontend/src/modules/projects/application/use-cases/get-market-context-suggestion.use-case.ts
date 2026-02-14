import { injectable, inject } from 'inversify';
import Result from '../../../../infrastructure/result/result';
import type { MarketContextRepositoryPort } from '../ports/market-context-repository.port';
import { GetMarketContextSuggestionRequest, GetMarketContextSuggestionResponse } from './input-output/get-market-context-suggestion.io';
import { TYPES } from '../../infrastructure/bootstrap/types';

@injectable()
export class GetMarketContextSuggestionUseCase {
  constructor(
    @inject(TYPES.MarketContextRepository)
    private readonly _marketContextRepository: MarketContextRepositoryPort
  ) {}

  async execute(request: GetMarketContextSuggestionRequest): Promise<Result<GetMarketContextSuggestionResponse, Error>> {
    return this._marketContextRepository.getSuggestions(request);
  }
}