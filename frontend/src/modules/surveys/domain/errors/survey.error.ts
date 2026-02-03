export abstract class SurveyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SurveyError';
  }
}

export class SurveyNotFoundError extends SurveyError {
  constructor(surveyId: string) {
    super(`Survey with id ${surveyId} not found`);
    this.name = 'SurveyNotFoundError';
  }
}

export class SurveyExpiredError extends SurveyError {
  constructor(token: string) {
    super(`Survey with token ${token} has expired`);
    this.name = 'SurveyExpiredError';
  }
}

export class QuestionRequiredError extends SurveyError {
  constructor(questionId: string) {
    super(`Question ${questionId} is required but not answered`);
    this.name = 'QuestionRequiredError';
  }
}



