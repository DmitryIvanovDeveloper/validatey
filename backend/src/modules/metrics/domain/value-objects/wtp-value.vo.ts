export class WTPValue {
  private constructor(
    private readonly _value: number,
    private readonly _currency: string = 'USD'
  ) {
    if (_value < 0) {
      throw new Error('WTP value cannot be negative');
    }
  }

  static create(value: number, currency?: string): WTPValue {
    return new WTPValue(value, currency || 'USD');
  }

  get value(): number {
    return this._value;
  }

  get currency(): string {
    return this._currency;
  }

  equals(other: WTPValue): boolean {
    return this._value === other._value && this._currency === other._currency;
  }

  toString(): string {
    return `${this._currency} ${this._value.toFixed(2)}`;
  }
}



