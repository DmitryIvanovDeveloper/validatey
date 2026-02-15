import { FetchCommentsInput, FetchCommentsResult } from '../ports/comment-fetcher.port';

export interface FetchCommentsUseCaseInput {
  sourceId: string;
  projectId: string;
  sourceType: 'reddit' | 'hackernews';
  redditUrls?: string[];
  hnFeedType?: 'top' | 'new' | 'ask' | 'show' | 'jobs' | 'newcomments';
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