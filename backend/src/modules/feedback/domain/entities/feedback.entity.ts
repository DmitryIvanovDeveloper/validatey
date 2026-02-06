/**
 * Feedback type from the widget (maps to DB type).
 */
export type FeedbackType = 'feature_request' | 'bug_report' | 'what_is_missing' | 'other';

/**
 * Feedback entity. Domain-only; no framework.
 */
export interface Feedback {
  id: string;
  type: FeedbackType;
  text: string;
  screenshotUrl: string | null;
  userId: string;
  pageUrl: string | null;
  createdAt: Date;
}
