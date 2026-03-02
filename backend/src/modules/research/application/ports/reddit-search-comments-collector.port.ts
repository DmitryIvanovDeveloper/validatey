import ResultEx from '../../../../infrastructure/result/result';

/**
 * Port for collecting Reddit comments by search query (Reddit JSON search API).
 * Used during research collect to auto-ingest Reddit comments matching the hypothesis topic.
 */
export interface RedditSearchCommentsCollectorPort {
  collect(projectId: string, searchQuery: string, subreddits?: string[]): Promise<ResultEx<{ count: number }, Error>>;
}
