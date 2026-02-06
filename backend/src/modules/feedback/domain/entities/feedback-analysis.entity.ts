/**
 * Result of AI analysis of user feedback. Domain-only; no framework.
 */
export interface FeedbackAnalysis {
  summary: string;
  themes: string[];
  suggestedActions: string[];
}
