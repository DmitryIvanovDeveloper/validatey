import type { MarketDataBlock } from './market-data-block.vo';
import type { CompetitorInfoBlock } from './competitor-info-block.vo';
import type { SynthesisReport } from './synthesis-report.vo';
import type { AutocompleteInsights } from './autocomplete-insights.vo';

/** Data persisted by ResearchDataRepository (market + competitor + autocomplete + optional synthesis). */
export interface StoredResearchData {
	readonly projectId: string;
	readonly marketData: MarketDataBlock | null;
	readonly competitorData: CompetitorInfoBlock | null;
	readonly autocompleteInsights: AutocompleteInsights | null;
	readonly synthesisReport: SynthesisReport | null;
	readonly updatedAt: Date;
}
