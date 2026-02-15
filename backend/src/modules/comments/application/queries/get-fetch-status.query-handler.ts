import { injectable, inject } from 'inversify';
import { COMMENT_TYPES } from '../../types';
import { GetFetchStatusUseCase } from '../use-cases/get-fetch-status.usecase';
import type { GetFetchStatusQueryResult } from './get-fetch-status.query';
import ResultEx from '../../../../infrastructure/result/result';

@injectable()
export class GetFetchStatusQueryHandler {
  constructor(
    @inject(COMMENT_TYPES.GetFetchStatusUseCase)
    private readonly _getFetchStatusUseCase: GetFetchStatusUseCase
  ) {}

  async execute(): Promise<ResultEx<GetFetchStatusQueryResult, Error>> {
    return this._getFetchStatusUseCase.execute();
  }
}