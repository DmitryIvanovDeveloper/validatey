/**
 * Command: start comments fetch (CQRS command side).
 * Returns void on success; does not return domain data.
 */
export interface StartFetchCommand {
  sourceId?: string;
  projectId?: string;
  sourceType?: 'reddit' | 'hackernews';
  redditUrls?: string[];
  hnFeedType?: 'top' | 'new' | 'ask' | 'show' | 'jobs' | 'newcomments';
  hnUrls?: string[];
  periodDays?: number;
}