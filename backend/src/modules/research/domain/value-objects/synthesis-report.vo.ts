import type { CommentPatternAnalysis } from '../../../comments/domain/value-objects/comment-pattern-analysis.vo';

/** Value object: synthesis report (LLM-generated summary). */
export interface SynthesisReport {
	readonly summary: string;
	readonly recommendations: readonly string[];
	readonly verdict: 'validated' | 'rejected' | 'needs-more-data';
	readonly sections?: readonly { readonly title: string; readonly content: string }[];
	readonly commentPatternAnalysis?: CommentPatternAnalysis;
}
