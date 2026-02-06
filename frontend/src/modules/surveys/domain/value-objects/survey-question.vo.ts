export type QuestionType = 'scale' | 'open' | 'audio' | 'multiple_choice';

export interface QuestionOptions {
  // For scale questions
  min?: number;
  max?: number;
  label?: string;
  // For multiple_choice questions
  choices?: string[];
  multiple?: boolean; // true for multiple selection, false for single
}

export class SurveyQuestion {
  constructor(
    public readonly id: string,
    public readonly type: QuestionType,
    public readonly text: string,
    public readonly required: boolean,
    public readonly options?: QuestionOptions
  ) {
    if (!id || id.trim().length === 0) {
      throw new Error('SurveyQuestion id cannot be empty');
    }
    if (!text || text.trim().length === 0) {
      throw new Error('SurveyQuestion text cannot be empty');
    }
  }

  public equals(other: SurveyQuestion): boolean {
    return (
      this.id === other.id &&
      this.type === other.type &&
      this.text === other.text &&
      this.required === other.required &&
      JSON.stringify(this.options) === JSON.stringify(other.options)
    );
  }
}



