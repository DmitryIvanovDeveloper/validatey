export type ParsingStrategy = "css";

export interface CustomSelectors {
  readonly strategy: ParsingStrategy;
  readonly selectors: Record<string, string>;
  readonly pagination?: string;
}

export function parseCustomSelectors(raw: unknown): CustomSelectors | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.strategy !== "css") return null;
  if (!o.selectors || typeof o.selectors !== "object") return null;
  const selectors: Record<string, string> = {};
  for (const [k, v] of Object.entries(o.selectors)) {
    if (typeof v === "string") selectors[k] = v;
  }
  if (Object.keys(selectors).length === 0) return null;
  return {
    strategy: "css",
    selectors,
    pagination: typeof o.pagination === "string" ? o.pagination : undefined,
  };
}
