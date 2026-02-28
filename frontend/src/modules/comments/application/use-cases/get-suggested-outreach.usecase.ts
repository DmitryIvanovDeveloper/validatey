import { injectable, inject } from 'inversify';
import type { CommentsHttpRepositoryPort, SuggestedOutreachCommenterDTO } from '../ports/comments-http-repository.port';
import { COMMENT_TYPES } from '../../types';
import Result from '../../../../infrastructure/result/result';

export interface GetSuggestedOutreachInput {
  projectId: string;
  limit?: number;
}

export interface GetSuggestedOutreachOutput {
  commenters: SuggestedOutreachCommenterDTO[];
}

@injectable()
export class GetSuggestedOutreachCommentersUseCase {
  constructor(
    @inject(COMMENT_TYPES.CommentsHttpRepository)
    private readonly _repository: CommentsHttpRepositoryPort
  ) {}

  async execute(input: GetSuggestedOutreachInput): Promise<Result<GetSuggestedOutreachOutput, Error>> {
    const result = await this._repository.getSuggestedOutreach(input.projectId, { limit: input.limit });
    if (!result.isSuccess) {
      return Result.failure(result.error ?? new Error('Failed to get suggested outreach'));
    }
    return Result.success({ commenters: result.data.commenters });
  }
}
