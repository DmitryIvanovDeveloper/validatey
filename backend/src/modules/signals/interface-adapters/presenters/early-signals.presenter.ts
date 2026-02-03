import { injectable, inject } from 'inversify';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { GetEarlySignalsByProjectIdUseCase } from '../../application/use-cases/get-early-signals-by-project-id.use-case';
import { GetEarlySignalsByProjectIdUseCaseRequest } from '../../application/use-cases/input-output/get-early-signals-by-project-id.io';

@injectable()
export class EarlySignalsPresenter {
  constructor(
    @inject(TYPES.GetEarlySignalsByProjectIdUseCase)
    private readonly _getEarlySignalsByProjectIdUseCase: GetEarlySignalsByProjectIdUseCase
  ) {}

  async getEarlySignalsByProjectId(request: GetEarlySignalsByProjectIdUseCaseRequest) {
    return await this._getEarlySignalsByProjectIdUseCase.execute(request);
  }
}
