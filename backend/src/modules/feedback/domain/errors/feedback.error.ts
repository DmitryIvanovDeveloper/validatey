/**
 * Thrown when feedback payload is invalid (empty text, invalid type, etc.).
 */
export class FeedbackValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FeedbackValidationError';
    Object.setPrototypeOf(this, FeedbackValidationError.prototype);
  }
}

/**
 * Thrown when AI analysis of feedback fails (LLM error, parse error, etc.).
 */
export class FeedbackAnalysisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FeedbackAnalysisError';
    Object.setPrototypeOf(this, FeedbackAnalysisError.prototype);
  }
}
