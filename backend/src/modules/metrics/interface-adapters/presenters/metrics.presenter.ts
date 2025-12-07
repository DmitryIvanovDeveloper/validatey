import { injectable, inject } from 'inversify';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { CalculateMetricsUseCase } from '../../application/use-cases/calculate-metrics.use-case';
import { CalculateMetricsUseCaseRequest } from '../../application/use-cases/input-output/calculate-metrics.io';

@injectable()
export class MetricsPresenter {
  constructor(
    @inject(TYPES.CalculateMetricsUseCase)
    private readonly _calculateMetricsUseCase: CalculateMetricsUseCase
  ) {}

  async calculateMetrics(request: CalculateMetricsUseCaseRequest) {
    return await this._calculateMetricsUseCase.execute(request);
  }
}


