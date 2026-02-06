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
