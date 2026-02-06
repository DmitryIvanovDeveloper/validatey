/** Value object: synthesis report (LLM-generated summary). */
export interface SynthesisReport {
	readonly summary: string;
	readonly recommendations: readonly string[];
	readonly sections?: readonly { readonly title: string; readonly content: string }[];
}
