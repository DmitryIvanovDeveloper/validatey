import { injectable, inject } from 'inversify';
import { COMMENT_TYPES } from '../../types';
import { GetCommentsUseCase } from '../use-cases/get-comments.usecase';
import type { GetCommentsQuery, GetCommentsQueryResult } from './get-comments.query';
import ResultEx from '../../../../infrastructure/result/result';

@injectable()
export class GetCommentsQueryHandler {
  constructor(
    @inject(COMMENT_TYPES.GetCommentsUseCase)
    private readonly _getCommentsUseCase: GetCommentsUseCase
  ) {}

  async execute(query: GetCommentsQuery): Promise<ResultEx<GetCommentsQueryResult, Error>> {
    const result = await this._getCommentsUseCase.execute(query);

    if (!result.isSuccess) {
      return ResultEx.failure(result.error);
    }

    return ResultEx.success({
      comments: result.data.comments,
      totalCount: result.data.totalCount || result.data.comments.length,
      hasMore: result.data.hasMore || false,
    });
  }
}