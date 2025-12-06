export class Hypothesis {
  constructor(
    public readonly description: string,
    public readonly assumptions: string[]
  ) {
    if (!description || description.trim().length === 0) {
      throw new Error('Hypothesis description cannot be empty');
    }
    // assumptions может быть пустым массивом, но не null/undefined
    if (!Array.isArray(assumptions)) {
      throw new Error('Hypothesis assumptions must be an array');
    }
  }

  equals(other: Hypothesis): boolean {
    return (
      this.description === other.description &&
      JSON.stringify(this.assumptions) === JSON.stringify(other.assumptions)
    );
  }
}

