export class LandingSlug {
  private constructor(private readonly _value: string) {
    if (!this.isValidSlug(_value)) {
      throw new Error('Invalid landing slug format');
    }
  }

  static create(value: string): LandingSlug {
    return new LandingSlug(value.toLowerCase().trim());
  }

  private isValidSlug(value: string): boolean {
    if (!value || value.length === 0) {
      return false;
    }

    // Only lowercase letters, numbers, and hyphens
    // Must start and end with letter or number
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return slugRegex.test(value) && value.length >= 3 && value.length <= 50;
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