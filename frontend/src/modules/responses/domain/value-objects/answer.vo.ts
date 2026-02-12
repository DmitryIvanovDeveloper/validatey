export interface Answer {
  readonly questionId: string;
  readonly questionText: string;
  readonly answerType: 'text' | 'number' | 'choice' | 'scale' | 'audio';
  readonly value: string | number | boolean | string[];
  readonly timestamp?: Date;
}

export class AnswerVO {
  constructor(
    private readonly _questionId: string,
    private readonly _questionText: string,
    private readonly _answerType: Answer['answerType'],
    private readonly _value: string | number | boolean | string[],
    private readonly _timestamp?: Date
  ) {}

  static fromData(data: Answer): AnswerVO {
    return new AnswerVO(
      data.questionId,
      data.questionText,
      data.answerType,
      data.value,
      data.timestamp
    );
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