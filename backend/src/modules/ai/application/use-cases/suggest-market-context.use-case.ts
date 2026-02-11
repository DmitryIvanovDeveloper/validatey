import { injectable, inject } from 'inversify';
import ResultEx from '../../../../infrastructure/result/result';
import { SearchServicePort } from '../ports/search-service.port';
import { MarketContextLlmPort } from '../ports/market-context-llm.port';
import { AiModuleError } from '../../domain/errors/ai.error';
import { SuggestMarketContextRequest, SuggestMarketContextResponse } from './input-output/suggest-market-context.io';
import { TYPES } from '../../infrastructure/bootstrap/types';

const MAX_SNIPPETS_TOTAL = 30;
const MAX_SNIPPET_LENGTH = 500;

@injectable()
export class SuggestMarketContextUseCase {
  constructor(
    @inject(TYPES.SearchService)
    private readonly _searchService: SearchServicePort,
    @inject(TYPES.MarketContextLlm)
    private readonly _llmPort: MarketContextLlmPort
  ) {}

  async execute(request: SuggestMarketContextRequest): Promise<ResultEx<SuggestMarketContextResponse, AiModuleError>> {
    const segmentDesc = (request.segmentDescription ?? '').trim();
    const productDesc = (request.productDescription ?? '').trim();
    const niche = segmentDesc || productDesc;
    if (!niche) {
      return ResultEx.failure(
        new AiModuleError('Provide segment or hypothesis (or product name) above for a relevant market context suggestion.')
      );
    }

    const queries = [
      `${niche} market players competitors who buys`,
      `${niche} market size paying audience share`,
      productDesc ? `${productDesc} differentiation unique value` : `${niche} product differentiation`,
    ];

    const allSnippets: string[] = [];
    for (const query of queries) {
      const result = await this._searchService.search(query);
      if (!result.isSuccess) {
        return ResultEx.failure(result.error);
      }
      for (const r of result.data) {
        const text = (r.snippet || r.title || '').trim().slice(0, MAX_SNIPPET_LENGTH);
        if (text && !allSnippets.includes(text)) {
          allSnippets.push(text);
          if (allSnippets.length >= MAX_SNIPPETS_TOTAL) break;
        }
      }
      if (allSnippets.length >= MAX_SNIPPETS_TOTAL) break;
    }

    const synthesizeResult = await this._llmPort.synthesize({
      segmentDescription: segmentDesc,
      segmentDemographics: request.segmentDemographics?.trim(),
      productDescription: productDesc || undefined,
      searchSnippets: allSnippets,
    });

    if (!synthesizeResult.isSuccess) {
      return ResultEx.failure(synthesizeResult.error);
    }

    return ResultEx.success(synthesizeResult.data);
  }
}
