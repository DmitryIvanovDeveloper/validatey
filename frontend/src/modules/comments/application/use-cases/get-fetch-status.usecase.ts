import { injectable, inject } from 'inversify';
import type { CommentsHttpRepositoryPort, FetchJobStateDTO } from '../ports/comments-http-repository.port';
import { COMMENT_TYPES } from '../../types';
import Result from '../../../../infrastructure/result/result';

@injectable()
export class GetFetchStatusUseCase {
  constructor(
    @inject(COMMENT_TYPES.CommentsHttpRepository)
    private readonly _repository: CommentsHttpRepositoryPort
  ) {}

  async execute(): Promise<Result<FetchJobStateDTO[], Error>> {
    const result = await this._repository.getFetchStatus();

    if (!result.isSuccess) {
      return Result.failure(result.error ?? new Error('Failed to get fetch status'));
    }

    return Result.success(result.data);
  }
}