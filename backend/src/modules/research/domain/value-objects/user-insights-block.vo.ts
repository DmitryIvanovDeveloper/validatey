/** Read-model block: pains, WTP, retention-like metrics from responses/signals (for Research Canvas). */
export interface UserInsightsBlock {
	readonly topPains?: readonly string[];
	readonly wtp?: string;
	readonly retentionHint?: string;
}
