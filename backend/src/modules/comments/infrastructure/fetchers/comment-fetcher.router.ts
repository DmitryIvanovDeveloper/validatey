import { injectable, inject } from 'inversify';
import {
  CommentFetcherPort,
  FetchCommentsInput,
  FetchCommentsResult,
} from '../../application/ports/comment-fetcher.port';
import { CommentFetchError } from '../../domain/errors/comment.error';
import ResultEx from '../../../../infrastructure/result/result';
import { COMMENT_TYPES } from '../../types';
import { RedditFetcher } from './reddit-fetcher';
import { HackerNewsFetcher } from './hacker-news-fetcher';

@injectable()
export class CommentFetcherRouter implements CommentFetcherPort {
  constructor(
    @inject(COMMENT_TYPES.RedditFetcher)
    private readonly _redditFetcher: RedditFetcher,
    @inject(COMMENT_TYPES.HackerNewsFetcher)
    private readonly _hackerNewsFetcher: HackerNewsFetcher
  ) {}

  public async fetch(input: FetchCommentsInput): Promise<ResultEx<FetchCommentsResult, CommentFetchError>> {
    if (input.sourceType === 'reddit') {
      return this._redditFetcher.fetch(input);
    }
    if (input.sourceType === 'hackernews') {
      return this._hackerNewsFetcher.fetch(input);
    }
    return ResultEx.success({ comments: [], errors: [] });
  }
}