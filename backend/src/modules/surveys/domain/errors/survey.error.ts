export class SurveyNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SurveyNotFoundError';
  }
}

export class InvalidSurveyDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidSurveyDataError';
  }
}


