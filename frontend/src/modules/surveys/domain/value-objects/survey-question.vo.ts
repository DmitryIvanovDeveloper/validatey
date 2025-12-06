export type QuestionType = 'scale' | 'open' | 'audio';

export class SurveyQuestion {
  constructor(
    public readonly id: string,
    public readonly type: QuestionType,
    public readonly text: string,
    public readonly required: boolean
  ) {
    if (!id || id.trim().length === 0) {
      throw new Error('SurveyQuestion id cannot be empty');
    }
    if (!text || text.trim().length === 0) {
      throw new Error('SurveyQuestion text cannot be empty');
    }
  }

  equals(other: SurveyQuestion): boolean {
    return (
      this.id === other.id &&
      this.type === other.type &&
      this.text === other.text &&
      this.required === other.required
    );
  }
}

