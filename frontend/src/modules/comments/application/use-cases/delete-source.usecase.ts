import { injectable, inject } from 'inversify';
import { CommentsHttpRepositoryPort } from '../ports/comments-http-repository.port';
import { COMMENT_TYPES } from '../../types';
import Result from '../../../../infrastructure/result/result';

@injectable()
export class DeleteSourceUseCase {
  constructor(
    @inject(COMMENT_TYPES.CommentsHttpRepository)
    private readonly _repository: CommentsHttpRepositoryPort
  ) {}

  async execute(projectId: string, sourceId: string): Promise<Result<void, Error>> {
    return this._repository.deleteSource(projectId, sourceId);
  }
}