export class ReportToken {
  private constructor(private readonly _value: string) {
    if (!_value || _value.trim().length === 0) {
      throw new Error('Report token cannot be empty');
    }
    if (_value.length < 16) {
      throw new Error('Report token must be at least 16 characters');
    }
  }

  static create(value: string): ReportToken {
    return new ReportToken(value);
  }

  static generate(): ReportToken {
    const token = `${Date.now()}_${Math.random().toString(36).substr(2, 16)}_${Math.random().toString(36).substr(2, 16)}`;
    return new ReportToken(token);
  }

  get value(): string {
    return this._value;
  }

  equals(other: ReportToken): boolean {
    return this._value === other._value;
  }
}

