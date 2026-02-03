import { injectable, inject } from 'inversify';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { SubmitTelemetryUseCase } from '../../application/use-cases/submit-telemetry.use-case';
import { SubmitTelemetryUseCaseRequest } from '../../application/use-cases/input-output/submit-telemetry.io';

@injectable()
export class TelemetryPresenter {
  constructor(
    @inject(TYPES.SubmitTelemetryUseCase)
    private readonly _submitTelemetryUseCase: SubmitTelemetryUseCase
  ) {}

  async submitTelemetry(request: SubmitTelemetryUseCaseRequest) {
    return await this._submitTelemetryUseCase.execute(request);
  }
}



