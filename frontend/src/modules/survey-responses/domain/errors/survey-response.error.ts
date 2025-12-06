export abstract class SurveyResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SurveyResponseError';
  }
}

export class InvalidAnswerError extends SurveyResponseError {
  constructor(message: string) {
    super(`Invalid answer: ${message}`);
    this.name = 'InvalidAnswerError';
  }
}

export class ResponseSaveError extends SurveyResponseError {
  constructor(message: string) {
    super(`Failed to save response: ${message}`);
    this.name = 'ResponseSaveError';
  }
}

