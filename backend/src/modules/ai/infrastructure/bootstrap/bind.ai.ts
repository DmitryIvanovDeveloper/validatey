import { Container } from 'inversify';
import { TYPES } from './types';
import { SearchServicePort } from '../../application/ports/search-service.port';
import { MarketContextLlmPort } from '../../application/ports/market-context-llm.port';
import { TextFormattingPort } from '../../application/ports/text-formatting.port';
import { SuggestMarketContextUseCase } from '../../application/use-cases/suggest-market-context.use-case';
import { FormatTextUseCase } from '../../application/use-cases/format-text.use-case';
import { SerperSearchService } from '../services/serper-search.service';
import { MarketContextLlmAdapter } from '../services/market-context-llm.adapter';
import { TextFormattingLlmAdapter } from '../services/text-formatting-llm.adapter';

export function bindAi(container: Container): void {
  container.bind<SearchServicePort>(TYPES.SearchService).to(SerperSearchService);
  container.bind<MarketContextLlmPort>(TYPES.MarketContextLlmPort).to(MarketContextLlmAdapter);
  container.bind<SuggestMarketContextUseCase>(TYPES.SuggestMarketContextUseCase).to(SuggestMarketContextUseCase);
  container.bind<TextFormattingPort>(TYPES.TextFormattingPort).to(TextFormattingLlmAdapter);
  container.bind<FormatTextUseCase>(TYPES.FormatTextUseCase).to(FormatTextUseCase);
}
