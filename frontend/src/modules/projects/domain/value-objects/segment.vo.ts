export class Segment {
  constructor(
    public readonly description: string,
    public readonly demographics: Record<string, any>
  ) {
    if (!description || description.trim().length === 0) {
      throw new Error('Segment description cannot be empty');
    }
  }

  equals(other: Segment): boolean {
    return (
      this.description === other.description &&
      JSON.stringify(this.demographics) === JSON.stringify(other.demographics)
    );
  }
}

