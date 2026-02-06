import { injectable, inject } from 'inversify';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { CalculateMetricsUseCase } from '../../application/use-cases/calculate-metrics.use-case';
import { CalculateMetricsUseCaseRequest } from '../../application/use-cases/input-output/calculate-metrics.io';

@injectable()
export class MetricsController {
	constructor(
		@inject(TYPES.CalculateMetricsUseCase)
		private readonly _calculateMetricsUseCase: CalculateMetricsUseCase
	) {}

	public async calculateMetrics(request: CalculateMetricsUseCaseRequest): Promise<ReturnType<CalculateMetricsUseCase['execute']>> {
		return this._calculateMetricsUseCase.execute(request);
	}
}
