import type { MarketDataBlock } from './market-data-block.entity';
import type { CompetitorInfoBlock } from './competitor-info-block.entity';
import type { UserInsightsBlock } from './user-insights-block.entity';
import type { AutocompleteInsights } from './autocomplete-insights.entity';

/** Read-model: unified canvas with market, competitors, user insights, autocomplete. */
export interface ResearchCanvas {
  readonly projectId: string;
  readonly marketData: MarketDataBlock;
  readonly competitorInfo: CompetitorInfoBlock;
  readonly userInsights: UserInsightsBlock;
  /** Google Place Autocomplete search phrases and suggestions (optional). */
  readonly autocompleteInsights?: AutocompleteInsights | null;
}
