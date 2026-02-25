/** A single academic paper returned from external research API. */
export interface AcademicPaper {
  readonly title: string;
  readonly year: number | null;
  /** Abstract truncated to ~300 characters for LLM context budget. */
  readonly abstractSnippet: string;
  readonly citationCount: number;
  readonly doi: string | null;
  readonly url: string | null;
}

/** Read-model block: academic papers relevant to the project hypothesis. */
export interface AcademicPapersBlock {
  readonly papers: readonly AcademicPaper[];
  /** The query sent to the API (for debugging and UI display). */
  readonly searchQuery: string;
  readonly fetchedAt: Date;
}
