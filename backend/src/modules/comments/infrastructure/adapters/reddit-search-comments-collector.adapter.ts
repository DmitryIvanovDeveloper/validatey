import { injectable, inject } from 'inversify';
import { COMMENT_TYPES } from '../../types';
import type { RedditSearchCommentsCollectorPort } from '../../../research/application/ports/reddit-search-comments-collector.port';
import ResultEx from '../../../../infrastructure/result/result';
import { FetchCommentsUseCase } from '../../application/use-cases/fetch-comments.usecase';

@injectable()
export class RedditSearchCommentsCollectorAdapter implements RedditSearchCommentsCollectorPort {
  constructor(
    @inject(COMMENT_TYPES.FetchCommentsUseCase)
    private readonly _fetchCommentsUseCase: FetchCommentsUseCase
  ) {}

  async collect(projectId: string, searchQuery: string, subreddits?: string[]): Promise<ResultEx<{ count: number }, Error>> {
    if (!searchQuery?.trim()) {
      return ResultEx.success({ count: 0 });
    }

    // If no subreddits provided by AI, skip Reddit search entirely
    if (!subreddits || subreddits.length === 0) {
      return ResultEx.success({ count: 0 });
    }

    const result = await this._fetchCommentsUseCase.execute({
      projectId,
      sourceType: 'reddit',
      redditSearchQuery: searchQuery.trim(),
      redditSubreddits: subreddits, // Pass AI-generated subreddits
    });

    if (!result.isSuccess) {
      return ResultEx.failure(result.error);
    }

    return ResultEx.success({ count: result.data.commentsCount });
  }
}
