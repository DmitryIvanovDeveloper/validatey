/**
 * Quality metrics for a scraper run (observability).
 * Populated by RunScraperUseCase from parse results.
 */
export interface RunStats {
  readonly urlsTotal: number;
  readonly urlsSuccess: number;
  readonly urlsWithItems: number;
  readonly totalItems: number;
  readonly avgItemsPerUrl: number;
}

export function createRunStats(
  urlsTotal: number,
  results: { data?: Record<string, unknown>; items?: unknown[]; error?: string }[]
): RunStats {
  const urlsSuccess = results.filter((r) => !r.error).length;
  const withItems = results.filter((r) => !r.error && Array.isArray(r.items) && r.items.length > 0);
  const totalItems = withItems.reduce((sum, r) => sum + (r.items?.length ?? 0), 0);
  const avgItemsPerUrl = urlsSuccess > 0 ? Math.round((totalItems / urlsSuccess) * 100) / 100 : 0;
  return {
    urlsTotal,
    urlsSuccess,
    urlsWithItems: withItems.length,
    totalItems,
    avgItemsPerUrl,
  };
}
