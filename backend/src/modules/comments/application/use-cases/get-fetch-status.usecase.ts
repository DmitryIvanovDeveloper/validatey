import { injectable, inject } from 'inversify';
import { COMMENT_TYPES } from '../../types';
import { FetchStatusReadModelPort } from '../ports/fetch-status-read-model.port';
import ResultEx from '../../../../infrastructure/result/result';
import { CommentError } from '../../domain/errors/comment.error';
import type { GetFetchStatusResponse } from '../input-output/get-fetch-status.io';

@injectable()
export class GetFetchStatusUseCase {
  constructor(
    @inject(COMMENT_TYPES.FetchStatusReadModel)
    private readonly _fetchStatusReadModel: FetchStatusReadModelPort
  ) {}

  async execute(): Promise<ResultEx<GetFetchStatusResponse, CommentError>> {
    const result = await this._fetchStatusReadModel.getStatus();

    if (!result.isSuccess) {
      return ResultEx.failure(result.error);
    }

    const jobs = result.data.map(job => ({
      jobId: job.jobId,
      status: job.status,
      commentsCount: job.commentsCount,
      error: job.error,
      currentSourceName: job.currentSourceName,
      startedAt: job.startedAt?.toISOString(),
      completedAt: job.completedAt?.toISOString(),
    }));

    return ResultEx.success({ jobs });
  }
}