export class ResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ResponseError';
  }
}

export class ResponseNotFoundError extends ResponseError {
  constructor(responseId: string) {
    super(`Response with id ${responseId} not found`);
    this.name = 'ResponseNotFoundError';
  }
}

export class InvalidResponseDataError extends ResponseError {
  constructor(message: string) {
    super(`Invalid response data: ${message}`);
    this.name = 'InvalidResponseDataError';
  }
}

export class AudioProcessingError extends ResponseError {
  constructor(message: string) {
    super(`Audio processing failed: ${message}`);
    this.name = 'AudioProcessingError';
  }
}

export class ModerationNotAllowedError extends ResponseError {
  constructor(responseId: string, reason?: string) {
    super(`Moderation not allowed for response ${responseId}${reason ? `: ${reason}` : ''}`);
    this.name = 'ModerationNotAllowedError';
  }
}



