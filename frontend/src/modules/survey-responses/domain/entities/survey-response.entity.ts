export class SurveyResponse {
  constructor(
    public readonly id: string,
    public readonly questionId: string,
    public readonly value: string | number,
    public readonly audioUrl: string | null,
    public readonly timestamp: Date
  ) {
    if (!id || id.trim().length === 0) {
      throw new Error('SurveyResponse id cannot be empty');
    }
    if (!questionId || questionId.trim().length === 0) {
      throw new Error('SurveyResponse questionId cannot be empty');
    }
  }
}

