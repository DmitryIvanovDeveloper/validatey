import { injectable, inject } from 'inversify';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { GetOverviewUseCase } from '../../application/use-cases/get-overview.use-case';
import type { GetOverviewRequest } from '../../application/use-cases/input-output/get-overview.io';

@injectable()
export class OverviewController {
  constructor(
    @inject(TYPES.GetOverviewUseCase)
    private readonly _getOverviewUseCase: GetOverviewUseCase
  ) {}

  async getOverview(request: GetOverviewRequest): Promise<ReturnType<GetOverviewUseCase['execute']>> {
    return this._getOverviewUseCase.execute(request);
  }
}
