import { injectable, inject } from 'inversify';
import { COMMENT_TYPES } from '../../types';
import { DeleteSourceCommand } from './delete-source.command';
import { CommentSourceRepositoryPort } from '../ports/comment-source-repository.port';
import ResultEx from '../../../../infrastructure/result/result';
import { CommentSourceError } from '../../domain/errors/comment.error';

@injectable()
export class DeleteSourceCommandHandler {
  constructor(
    @inject(COMMENT_TYPES.CommentSourceRepository)
    private readonly _sourceRepository: CommentSourceRepositoryPort
  ) {}

  async execute(command: DeleteSourceCommand): Promise<ResultEx<void, CommentSourceError>> {
    try {
      // First check if the source exists and belongs to the project
      const sourceResult = await this._sourceRepository.findById(command.sourceId);
      if (!sourceResult.isSuccess) {
        return ResultEx.failure(new CommentSourceError(`Source not found: ${command.sourceId}`));
      }

      const source = sourceResult.data;
      if (source.projectId !== command.projectId) {
        return ResultEx.failure(new CommentSourceError('Source does not belong to this project'));
      }

      // Delete the source (comments will be cascade deleted due to foreign key constraint)
      const deleteResult = await this._sourceRepository.delete(command.sourceId);
      if (!deleteResult.isSuccess) {
        return ResultEx.failure(deleteResult.error);
      }

      return ResultEx.success(undefined);
    } catch (error) {
      return ResultEx.failure(new CommentSourceError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      ));
    }
  }
}