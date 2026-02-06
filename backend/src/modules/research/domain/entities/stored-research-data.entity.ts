import type { MarketDataBlock } from './market-data-block.entity';
import type { CompetitorInfoBlock } from './competitor-info-block.entity';
import type { SynthesisReport } from './synthesis-report.entity';
import type { AutocompleteInsights } from './autocomplete-insights.entity';

/** Data persisted by ResearchDataRepository (market + competitor + autocomplete + optional synthesis). */
export interface StoredResearchData {
  readonly projectId: string;
  readonly marketData: MarketDataBlock | null;
  readonly competitorData: CompetitorInfoBlock | null;
  readonly autocompleteInsights: AutocompleteInsights | null;
  readonly synthesisReport: SynthesisReport | null;
  readonly updatedAt: Date;
}
