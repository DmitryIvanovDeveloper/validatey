export const TYPES = {
  SearchService: Symbol.for('AiSearchService'),
  MarketContextLlmPort: Symbol.for('MarketContextLlmPort'),
  SuggestMarketContextUseCase: Symbol.for('SuggestMarketContextUseCase'),
  TextFormattingPort: Symbol.for('TextFormattingPort'),
  FormatTextUseCase: Symbol.for('FormatTextUseCase'),
} as const;
