import { injectable, inject } from 'inversify';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { SubmitResponseUseCase } from '../../application/use-cases/submit-response.use-case';
import { SubmitResponseUseCaseRequest } from '../../application/use-cases/input-output/submit-response.io';

@injectable()
export class ResponsePresenter {
  constructor(
    @inject(TYPES.SubmitResponseUseCase)
    private readonly _submitResponseUseCase: SubmitResponseUseCase
  ) {}

  async submitResponse(request: SubmitResponseUseCaseRequest) {
    return await this._submitResponseUseCase.execute(request);
  }
}

