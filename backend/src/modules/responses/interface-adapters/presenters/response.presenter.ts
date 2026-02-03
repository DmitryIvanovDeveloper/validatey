import { injectable, inject } from 'inversify';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { SubmitResponseUseCase } from '../../application/use-cases/submit-response.use-case';
import { SubmitResponseUseCaseRequest } from '../../application/use-cases/input-output/submit-response.io';
import { GetResponsesByProjectIdUseCase } from '../../application/use-cases/get-responses-by-project-id.use-case';
import { GetResponsesByProjectIdUseCaseRequest } from '../../application/use-cases/input-output/get-responses-by-project-id.io';

@injectable()
export class ResponsePresenter {
  constructor(
    @inject(TYPES.SubmitResponseUseCase)
    private readonly _submitResponseUseCase: SubmitResponseUseCase,
    @inject(TYPES.GetResponsesByProjectIdUseCase)
    private readonly _getResponsesByProjectIdUseCase: GetResponsesByProjectIdUseCase
  ) {}

  async submitResponse(request: SubmitResponseUseCaseRequest) {
    return await this._submitResponseUseCase.execute(request);
  }

  async getResponsesByProjectId(request: GetResponsesByProjectIdUseCaseRequest) {
    return await this._getResponsesByProjectIdUseCase.execute(request);
  }
}



