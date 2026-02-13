import type { MarketDataBlock } from './market-data-block.vo';
import type { CompetitorInfoBlock } from './competitor-info-block.vo';
import type { UserInsightsBlock } from './user-insights-block.vo';
import type { AutocompleteInsights } from './autocomplete-insights.vo';

/** Early signals generated from respondent feedback */
export interface EarlySignal {
	readonly id: string;
	readonly type: 'positive' | 'negative' | 'neutral';
	readonly title: string;
	readonly description: string;
}

/** Read-model: unified canvas with market, competitors, user insights, autocomplete, and early signals. */
export interface ResearchCanvas {
	readonly projectId: string;
	readonly marketData: MarketDataBlock;
	readonly competitorInfo: CompetitorInfoBlock;
	readonly userInsights: UserInsightsBlock;
	/** Google Place Autocomplete search phrases and suggestions (optional). */
	readonly autocompleteInsights?: AutocompleteInsights | null;
	/** Early signals generated from respondent feedback. */
	readonly earlySignals?: EarlySignal[] | null;
}
