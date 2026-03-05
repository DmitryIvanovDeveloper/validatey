export class LandingSlug {
  private constructor(private readonly _value: string) {}

  static create(value: string): LandingSlug {
    // Frontend validation is more lenient, backend does strict validation
    return new LandingSlug(value.toLowerCase().trim());
  }

  get value(): string {
    return this._value;
  }

  toString(): string {
    return this._value;
  }

  equals(other: LandingSlug): boolean {
    return this._value === other._value;
  }
}