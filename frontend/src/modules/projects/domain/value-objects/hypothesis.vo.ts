export type AssumptionItem = { readonly id: string; readonly text: string };

/**
 * Normalize assumptions from API: legacy string[] or { id?, text }[] → AssumptionItem[].
 */
export function normalizeAssumptions(
  raw: string[] | Array<{ id?: string; text: string }>
): AssumptionItem[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  if (typeof raw[0] === 'string') {
    return (raw as string[]).map((text) => ({
      id: crypto.randomUUID(),
      text,
    }));
  }
  return (raw as Array<{ id?: string; text: string }>).map((a) => ({
    id: a.id ?? crypto.randomUUID(),
    text: a.text,
  }));
}

export class Hypothesis {
  constructor(
    public readonly description: string,
    public readonly assumptions: AssumptionItem[]
  ) {
    if (!description || description.trim().length === 0) {
      throw new Error('Hypothesis description cannot be empty');
    }
    if (!Array.isArray(assumptions)) {
      throw new Error('Hypothesis assumptions must be an array');
    }
  }

  public equals(other: Hypothesis): boolean {
    return (
      this.description === other.description &&
      JSON.stringify(this.assumptions) === JSON.stringify(other.assumptions)
    );
  }
}
