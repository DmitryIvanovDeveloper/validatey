import ResultEx from '../../../../infrastructure/result/result';
import type { AssumptionAssessment } from '../../domain/value-objects/assumption-assessment.vo';

export interface AssumptionAssessmentInputItem {
	readonly assumptionId: string;
	readonly text: string;
}

export interface AssumptionAssessmentContext {
	readonly synthesisSummary: string;
	readonly verdict: string;
	readonly userInsightsSummary: string;
	readonly earlySignalsSummary: string;
}

export interface AssumptionAssessmentLlmPort {
	generate(
		assumptions: ReadonlyArray<AssumptionAssessmentInputItem>,
		context: AssumptionAssessmentContext
	): Promise<ResultEx<AssumptionAssessment[], Error>>;
}
