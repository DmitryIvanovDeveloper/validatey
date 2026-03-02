import { FetchCommentsInput, FetchCommentsResult } from '../ports/comment-fetcher.port';

export interface FetchCommentsUseCaseInput {
  sourceId?: string;
  projectId: string;
  sourceType: 'reddit' | 'hackernews';
  redditUrls?: string[];
  /** When set with sourceType reddit, fetches comments via Reddit JSON search API (no URL needed). */
  redditSearchQuery?: string;
  /** AI-generated subreddits to search in (Reddit search only). */
  redditSubreddits?: string[];
  hnFeedType?: 'top' | 'new' | 'ask' | 'show' | 'jobs' | 'newcomments';
  /** When set with sourceType hackernews, fetches comments via Algolia search (no feed/URL needed). */
  hnSearchQuery?: string;
  hnUrl?: string;
  periodDays?: number;
}

export interface FetchCommentsUseCaseOutput {
  success: boolean;
  commentsCount: number;
  sourcesProcessed: number;
  commentsBySource: Record<string, number>;
  errors: string[] | null;
  fetchedAt: Date;
}