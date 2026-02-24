import ResultEx from '../../../../infrastructure/result/result';
import type { AssumptionAssessment } from '../../domain/value-objects/assumption-assessment.vo';

export interface AssumptionAssessmentInputItem {
	readonly assumptionId: string;
	readonly text: string;
}

export interface AssumptionAssessmentContext {
	readonly synthesisSummary: string;
	readonly verdict: string;
	/** Full project hypothesis text — used to identify distinct audience groups mentioned in the hypothesis
	 *  so the LLM can correctly reason about which assumptions belong to which audience. */
	readonly hypothesisSummary: string;
	readonly userInsightsSummary: string;
	readonly commentsSummary: string;
	readonly commentPatternSummary?: string;
	/** Factual description of where comments were collected from (sources, topics, counts).
	 *  Helps LLM reason about commenter identity without hardcoding platform names. */
	readonly dataSourcesSummary?: string;
	readonly earlySignalsSummary: string;
}

export interface AssumptionAssessmentLlmPort {
	generate(
		assumptions: ReadonlyArray<AssumptionAssessmentInputItem>,
		context: AssumptionAssessmentContext
	): Promise<ResultEx<AssumptionAssessment[], Error>>;
}
