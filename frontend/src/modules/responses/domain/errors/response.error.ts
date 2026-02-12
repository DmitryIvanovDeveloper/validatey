export class ResponseError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'ResponseError';
  }
}

export class ResponseNotFoundError extends ResponseError {
  constructor(responseId: string) {
    super(`Response with id ${responseId} not found`, 'RESPONSE_NOT_FOUND', { responseId });
  }
}

export class ResponseValidationError extends ResponseError {
  constructor(field: string, reason: string) {
    super(`Invalid response data: ${reason}`, 'RESPONSE_VALIDATION_ERROR', { field, reason });
  }
}

export class ResponseModerationError extends ResponseError {
  constructor(responseId: string, reason: string) {
    super(`Cannot moderate response: ${reason}`, 'RESPONSE_MODERATION_ERROR', { responseId, reason });
  }
}