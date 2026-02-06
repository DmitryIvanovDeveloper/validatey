import { injectable, inject } from 'inversify';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { GetEarlySignalsByProjectIdUseCase } from '../../application/use-cases/get-early-signals-by-project-id.use-case';
import { GetEarlySignalsByProjectIdUseCaseRequest } from '../../application/use-cases/input-output/get-early-signals-by-project-id.io';

@injectable()
export class EarlySignalsController {
	constructor(
		@inject(TYPES.GetEarlySignalsByProjectIdUseCase)
		private readonly _getEarlySignalsByProjectIdUseCase: GetEarlySignalsByProjectIdUseCase
	) {}

	public async getEarlySignalsByProjectId(request: GetEarlySignalsByProjectIdUseCaseRequest): Promise<ReturnType<GetEarlySignalsByProjectIdUseCase['execute']>> {
		return this._getEarlySignalsByProjectIdUseCase.execute(request);
	}
}
