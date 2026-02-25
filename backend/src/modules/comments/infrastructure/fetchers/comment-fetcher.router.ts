import { injectable, inject } from 'inversify';
import {
  CommentFetcherPort,
  FetchCommentsInput,
  FetchCommentsInputReddit,
  FetchCommentsResult,
} from '../../application/ports/comment-fetcher.port';
import type { FetchCommentsInputHackerNews } from '../../application/ports/comment-fetcher.port';
import { CommentFetchError } from '../../domain/errors/comment.error';
import ResultEx from '../../../../infrastructure/result/result';
import { COMMENT_TYPES } from '../../types';
import { RedditFetcher } from './reddit-fetcher';
import { RedditSearchFetcher } from './reddit-search-fetcher';
import { HackerNewsFetcher } from './hacker-news-fetcher';
import { HackerNewsAlgoliaFetcher } from './hacker-news-algolia-fetcher';
import { LinkedInFetcher } from './linkedin-fetcher';

@injectable()
export class CommentFetcherRouter implements CommentFetcherPort {
  constructor(
    @inject(COMMENT_TYPES.RedditFetcher)
    private readonly _redditFetcher: RedditFetcher,
    @inject(COMMENT_TYPES.RedditSearchFetcher)
    private readonly _redditSearchFetcher: RedditSearchFetcher,
    @inject(COMMENT_TYPES.HackerNewsFetcher)
    private readonly _hackerNewsFetcher: HackerNewsFetcher,
    @inject(COMMENT_TYPES.HackerNewsAlgoliaFetcher)
    private readonly _hnAlgoliaFetcher: HackerNewsAlgoliaFetcher,
    @inject(COMMENT_TYPES.LinkedInFetcher)
    private readonly _linkedInFetcher: LinkedInFetcher
  ) {}

  public async fetch(input: FetchCommentsInput): Promise<ResultEx<FetchCommentsResult, CommentFetchError>> {
    if (input.sourceType === 'reddit') {
      const redditInput = input as FetchCommentsInputReddit;
      if (redditInput.searchQuery?.trim()) {
        return this._redditSearchFetcher.fetch(input);
      }
      return this._redditFetcher.fetch(input);
    }
    if (input.sourceType === 'hackernews') {
      const hnInput = input as FetchCommentsInputHackerNews;
      if (hnInput.searchQuery?.trim()) {
        return this._hnAlgoliaFetcher.fetch(input);
      }
      return this._hackerNewsFetcher.fetch(input);
    }
    if (input.sourceType === 'linkedin') {
      return this._linkedInFetcher.fetch(input);
    }
    return ResultEx.success({ comments: [], errors: [] });
  }
}