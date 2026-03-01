import type { MarketDataBlock } from './market-data-block.vo';
import type { CompetitorInfoBlock } from './competitor-info-block.vo';
import type { SynthesisReport } from './synthesis-report.vo';
import type { AutocompleteInsights } from './autocomplete-insights.vo';
import type { UserInsightsBlock } from './user-insights-block.vo';
import type { AssumptionAssessment } from './assumption-assessment.vo';
import type { AcademicPapersBlock } from './academic-papers-block.vo';
import type { ProductHuntBlock } from './product-hunt-block.vo';
import type { CommentPatternAnalysis } from '../../../comments/domain/value-objects/comment-pattern-analysis.vo';
import type { ResearchStatus } from './research-status.vo';
import type { UserStory } from '../../application/ports/user-stories-llm.port';

/** Data persisted by ResearchDataRepository (market + competitor + autocomplete + user insights + optional synthesis + assumption assessments + comment pattern analysis + academic papers). */
export interface StoredResearchData {
	readonly projectId: string;
	readonly marketData: MarketDataBlock | null;
	readonly competitorData: CompetitorInfoBlock | null;
	readonly userInsights: UserInsightsBlock | null;
	readonly autocompleteInsights: AutocompleteInsights | null;
	readonly synthesisReport: SynthesisReport | null;
	readonly assumptionAssessments: AssumptionAssessment[] | null;
	readonly commentPatternAnalysis: CommentPatternAnalysis | null;
	readonly academicPapers: AcademicPapersBlock | null;
	readonly productHunt: ProductHuntBlock | null;
	readonly userStories: UserStory[] | null;
	readonly userStoriesGeneratedAt: Date | null;
	readonly commentMetrics?: {
		totalCount: number;
		bySource: Record<string, number>;
	};
	readonly lastResearchRunAt: Date | null;
	readonly updatedAt: Date;
	/** Current research phase; used to restore "in progress" state after page reload. */
	readonly researchStatus?: ResearchStatus;
	readonly researchStatusUpdatedAt?: Date | null;
}
