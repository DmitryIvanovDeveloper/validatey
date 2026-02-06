import type { MarketDataBlock } from './market-data-block.entity';
import type { CompetitorInfoBlock } from './competitor-info-block.entity';
import type { UserInsightsBlock } from './user-insights-block.entity';

/** Read-model: unified canvas with market, competitors, user insights. */
export interface ResearchCanvas {
  readonly projectId: string;
  readonly marketData: MarketDataBlock;
  readonly competitorInfo: CompetitorInfoBlock;
  readonly userInsights: UserInsightsBlock;
}
