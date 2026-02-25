import ResultEx from '../../../../infrastructure/result/result';

/**
 * Port for collecting Hacker News comments by search query (Algolia).
 * Used during research collect to auto-ingest HN comments matching the hypothesis topic.
 */
export interface HnSearchCommentsCollectorPort {
  collect(projectId: string, searchQuery: string): Promise<ResultEx<{ count: number }, Error>>;
}
