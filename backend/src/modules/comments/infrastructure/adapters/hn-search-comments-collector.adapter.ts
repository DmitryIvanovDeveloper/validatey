import { injectable, inject } from 'inversify';
import { COMMENT_TYPES } from '../../types';
import type { HnSearchCommentsCollectorPort } from '../../../research/application/ports/hn-search-comments-collector.port';
import ResultEx from '../../../../infrastructure/result/result';
import { FetchCommentsUseCase } from '../../application/use-cases/fetch-comments.usecase';

@injectable()
export class HnSearchCommentsCollectorAdapter implements HnSearchCommentsCollectorPort {
  constructor(
    @inject(COMMENT_TYPES.FetchCommentsUseCase)
    private readonly _fetchCommentsUseCase: FetchCommentsUseCase
  ) {}

  async collect(projectId: string, searchQuery: string): Promise<ResultEx<{ count: number }, Error>> {
    if (!searchQuery?.trim()) {
      return ResultEx.success({ count: 0 });
    }

    const result = await this._fetchCommentsUseCase.execute({
      projectId,
      sourceType: 'hackernews',
      hnSearchQuery: searchQuery.trim(),
    });

    if (!result.isSuccess) {
      return ResultEx.failure(result.error);
    }

    return ResultEx.success({ count: result.data.commentsCount });
  }
}
