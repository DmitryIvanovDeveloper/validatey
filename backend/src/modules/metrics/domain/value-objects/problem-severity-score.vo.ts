export class ProblemSeverityScore {
  private constructor(private readonly _value: number) {
    if (_value < 1 || _value > 5) {
      throw new Error('Problem severity score must be between 1 and 5');
    }
  }

  static create(value: number): ProblemSeverityScore {
    return new ProblemSeverityScore(value);
  }

  get value(): number {
    return this._value;
  }

  isHigh(): boolean {
    return this._value >= 4;
  }

  isCritical(): boolean {
    return this._value >= 4.5;
  }

  equals(other: ProblemSeverityScore): boolean {
    return this._value === other._value;
  }
}


