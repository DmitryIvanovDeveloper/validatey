import type { MarketDataBlock } from './market-data-block.vo';
import type { CompetitorInfoBlock } from './competitor-info-block.vo';
import type { SynthesisReport } from './synthesis-report.vo';
import type { AutocompleteInsights } from './autocomplete-insights.vo';
import type { UserInsightsBlock } from './user-insights-block.vo';
import type { AssumptionAssessment } from './assumption-assessment.vo';

/** Data persisted by ResearchDataRepository (market + competitor + autocomplete + user insights + optional synthesis + assumption assessments). */
export interface StoredResearchData {
	readonly projectId: string;
	readonly marketData: MarketDataBlock | null;
	readonly competitorData: CompetitorInfoBlock | null;
	readonly userInsights: UserInsightsBlock | null;
	readonly autocompleteInsights: AutocompleteInsights | null;
	readonly synthesisReport: SynthesisReport | null;
	readonly assumptionAssessments: AssumptionAssessment[] | null;
	readonly lastResearchRunAt: Date | null;
	readonly updatedAt: Date;
}
