export interface Answer {
  readonly questionId: string;
  readonly questionText: string;
  readonly answerType: 'text' | 'number' | 'choice' | 'scale' | 'audio';
  readonly value: string | number | boolean | string[];
  readonly timestamp?: Date;
}

export class AnswerVO {
  private constructor(
    private readonly _questionId: string,
    private readonly _questionText: string,
    private readonly _answerType: Answer['answerType'],
    private readonly _value: string | number | boolean | string[],
    private readonly _timestamp?: Date
  ) {
    if (!_questionId || _questionId.trim().length === 0) {
      throw new Error('Question ID is required');
    }
    if (!_questionText || _questionText.trim().length === 0) {
      throw new Error('Question text is required');
    }
    if (_value === undefined || _value === null) {
      throw new Error('Answer value is required');
    }
  }

  static create(
    questionId: string,
    questionText: string,
    answerType: Answer['answerType'],
    value: string | number | boolean | string[],
    timestamp?: Date
  ): AnswerVO {
    return new AnswerVO(questionId, questionText, answerType, value, timestamp || new Date());
  }

  get questionId(): string {
    return this._questionId;
  }

  get questionText(): string {
    return this._questionText;
  }

  get answerType(): Answer['answerType'] {
    return this._answerType;
  }

  get value(): string | number | boolean | string[] {
    return this._value;
  }

  get timestamp(): Date | undefined {
    return this._timestamp;
  }

  toData(): Answer {
    return {
      questionId: this._questionId,
      questionText: this._questionText,
      answerType: this._answerType,
      value: this._value,
      timestamp: this._timestamp,
    };
  }
}



