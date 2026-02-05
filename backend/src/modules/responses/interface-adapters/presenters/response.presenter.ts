import { injectable, inject } from 'inversify';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { SubmitResponseUseCase } from '../../application/use-cases/submit-response.use-case';
import { SubmitResponseUseCaseRequest } from '../../application/use-cases/input-output/submit-response.io';
import { GetResponsesByProjectIdUseCase } from '../../application/use-cases/get-responses-by-project-id.use-case';
import { GetResponsesByProjectIdUseCaseRequest } from '../../application/use-cases/input-output/get-responses-by-project-id.io';
import { ExportResponsesUseCase } from '../../application/use-cases/export-responses.use-case';
import { ExportResponsesUseCaseRequest } from '../../application/use-cases/input-output/export-responses.io';
import { ListResponsesForModerationUseCase } from '../../application/use-cases/list-responses-for-moderation.use-case';
import { ListResponsesForModerationUseCaseRequest } from '../../application/use-cases/input-output/list-responses-for-moderation.io';
import { ModerateResponseUseCase } from '../../application/use-cases/moderate-response.use-case';
import { ModerateResponseUseCaseRequest } from '../../application/use-cases/input-output/moderate-response.io';

@injectable()
export class ResponsePresenter {
  constructor(
    @inject(TYPES.SubmitResponseUseCase)
    private readonly _submitResponseUseCase: SubmitResponseUseCase,
    @inject(TYPES.GetResponsesByProjectIdUseCase)
    private readonly _getResponsesByProjectIdUseCase: GetResponsesByProjectIdUseCase,
    @inject(TYPES.ExportResponsesUseCase)
    private readonly _exportResponsesUseCase: ExportResponsesUseCase,
    @inject(TYPES.ListResponsesForModerationUseCase)
    private readonly _listResponsesForModerationUseCase: ListResponsesForModerationUseCase,
    @inject(TYPES.ModerateResponseUseCase)
    private readonly _moderateResponseUseCase: ModerateResponseUseCase
  ) {}

  async submitResponse(request: SubmitResponseUseCaseRequest) {
    return await this._submitResponseUseCase.execute(request);
  }

  async getResponsesByProjectId(request: GetResponsesByProjectIdUseCaseRequest) {
    return await this._getResponsesByProjectIdUseCase.execute(request);
  }

  async exportResponses(request: ExportResponsesUseCaseRequest) {
    return await this._exportResponsesUseCase.execute(request);
  }

  async listResponsesForModeration(request: ListResponsesForModerationUseCaseRequest) {
    return await this._listResponsesForModerationUseCase.execute(request);
  }

  async moderateResponse(request: ModerateResponseUseCaseRequest) {
    return await this._moderateResponseUseCase.execute(request);
  }
}



