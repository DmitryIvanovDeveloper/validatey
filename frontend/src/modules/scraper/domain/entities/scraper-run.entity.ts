/** Run quality metrics (from API). */
export interface RunStats {
  urlsTotal: number;
  urlsSuccess: number;
  urlsWithItems: number;
  totalItems: number;
  avgItemsPerUrl: number;
}

/** Scraper run result — matches API shape. */
export interface ScraperRun {
  id: string;
  scraperSourceId: string;
  projectId: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
  rawResult?: { results?: { url: string; data?: unknown; items?: unknown[]; error?: string }[] };
  insightsSummary?: string | null;
  stats?: RunStats | null;
  createdAt: string;
  updatedAt: string;
}
