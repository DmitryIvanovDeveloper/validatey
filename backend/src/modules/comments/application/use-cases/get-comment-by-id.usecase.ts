import { injectable, inject } from 'inversify';
import { COMMENT_TYPES } from '../../types';
import { CommentRepositoryPort } from '../ports/comment-repository.port';
import ResultEx from '../../../../infrastructure/result/result';
import { CommentNotFoundError } from '../../domain/errors/comment.error';
import type { CommentDetailDTO } from '../queries/get-comment-by-id.query';

@injectable()
export class GetCommentByIdUseCase {
  constructor(
    @inject(COMMENT_TYPES.CommentRepository)
    private readonly _commentRepository: CommentRepositoryPort
  ) {}

  async execute(id: string): Promise<ResultEx<{ comment: CommentDetailDTO }, CommentNotFoundError>> {
    const result = await this._commentRepository.findById(id);

    if (!result.isSuccess) {
      return ResultEx.failure(result.error);
    }

    const comment = result.data.toData();

    return ResultEx.success({
      comment: {
        id: comment.id,
        sourceId: comment.sourceId,
        projectId: comment.projectId,
        externalId: comment.externalId,
        content: comment.content,
        author: comment.author,
        url: comment.url,
        contextTitle: comment.contextTitle,
        contextUrl: comment.contextUrl,
        createdAt: comment.createdAt,
        fetchedAt: comment.fetchedAt,
        isProcessed: comment.isProcessed,
        processedAt: comment.processedAt,
        importOrigin: comment.importOrigin,
        subsourceName: comment.subsourceName,
      }
    });
  }
}