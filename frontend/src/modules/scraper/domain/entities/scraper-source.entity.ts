/** Scraper source (data source) — matches API shape. */
export interface ScraperSource {
  id: string;
  projectId: string;
  type: string;
  name: string | null;
  researchGoal?: string | null;
  urls: string[];
  whatToCollect: string[];
  frequency: string;
  aiProcessing: string;
  customSelectors: unknown;
  createdAt: string;
  updatedAt: string;
}
