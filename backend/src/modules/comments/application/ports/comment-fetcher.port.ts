import ResultEx from '../../../../infrastructure/result/result';
import { CommentFetchError } from '../../domain/errors/comment.error';

/**
 * Raw comment data from external source (e.g. Reddit, HN), before persistence
 */
export interface FetchedCommentRaw {
  externalId: string;
  content: string;
  author: string | null;
  url: string;
  contextTitle: string | null;
  contextUrl: string | null;
  createdAt: Date;
}

/** Reddit-specific fetch input */
export interface FetchCommentsInputReddit {
  sourceType: 'reddit';
  subredditNames: string[];
  postId?: string; // For specific post fetching
  limitPerSubreddit?: number;
  apiCredentials?: {
    clientId?: string;
    clientSecret?: string;
    userAgent?: string;
  };
  /** Only include comments created on or after this date (UTC) */
  sinceDate?: Date;
  /** Pagination: Reddit fullname (e.g. t1_xxx) to fetch next page */
  after?: string;
}

/** Hacker News-specific fetch input */
export interface FetchCommentsInputHackerNews {
  sourceType: 'hackernews';
  feedType?: 'top' | 'new' | 'ask' | 'show' | 'jobs' | 'newcomments';
  itemId?: string; // For specific post fetching
  /** When set, fetch comments via Algolia search (hn.algolia.com) instead of Firebase API */
  searchQuery?: string;
  limitStories?: number;
  /** Only include comments/stories created on or after this date (UTC) */
  sinceDate?: Date;
}

/** LinkedIn-specific fetch input */
export interface FetchCommentsInputLinkedIn {
  sourceType: 'linkedin';
  url: string; // LinkedIn post URL
  postId?: string; // Extracted post ID
  /** Only include comments created on or after this date (UTC) */
  sinceDate?: Date;
}

/** Discriminated union: Reddit, Hacker News, or LinkedIn */
export type FetchCommentsInput = FetchCommentsInputReddit | FetchCommentsInputHackerNews | FetchCommentsInputLinkedIn;

export interface FetchCommentsResult {
  comments: FetchedCommentRaw[];
  errors?: string[];
  /** Reddit: fullname for next page (null when no more pages) */
  nextAfter?: string | null;
}

/**
 * Port for fetching comments from external sources (Reddit, Hacker News)
 */
export interface CommentFetcherPort {
  fetch(input: FetchCommentsInput): Promise<ResultEx<FetchCommentsResult, CommentFetchError>>;
}