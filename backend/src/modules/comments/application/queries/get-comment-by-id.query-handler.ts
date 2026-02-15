import { injectable, inject } from 'inversify';
import { COMMENT_TYPES } from '../../types';
import { GetCommentByIdUseCase } from '../use-cases/get-comment-by-id.usecase';
import type { GetCommentByIdQuery } from './get-comment-by-id.query';
import ResultEx from '../../../../infrastructure/result/result';

@injectable()
export class GetCommentByIdQueryHandler {
  constructor(
    @inject(COMMENT_TYPES.GetCommentByIdUseCase)
    private readonly _getCommentByIdUseCase: GetCommentByIdUseCase
  ) {}

  async execute(query: GetCommentByIdQuery): Promise<ResultEx<{ comment: any }, Error>> {
    return this._getCommentByIdUseCase.execute(query.id);
  }
}