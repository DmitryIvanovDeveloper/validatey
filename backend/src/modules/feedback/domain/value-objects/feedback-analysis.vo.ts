/**
 * Result of AI analysis of user feedback. Value object; no identity.
 */
export interface FeedbackAnalysis {
	readonly summary: string;
	readonly themes: readonly string[];
	readonly suggestedActions: readonly string[];
}
