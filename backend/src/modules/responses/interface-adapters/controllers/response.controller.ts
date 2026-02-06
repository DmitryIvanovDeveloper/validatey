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
export class ResponseController {
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

	public async submitResponse(request: SubmitResponseUseCaseRequest): Promise<ReturnType<SubmitResponseUseCase['execute']>> {
		return this._submitResponseUseCase.execute(request);
	}

	public async getResponsesByProjectId(request: GetResponsesByProjectIdUseCaseRequest): Promise<ReturnType<GetResponsesByProjectIdUseCase['execute']>> {
		return this._getResponsesByProjectIdUseCase.execute(request);
	}

	public async exportResponses(request: ExportResponsesUseCaseRequest): Promise<ReturnType<ExportResponsesUseCase['execute']>> {
		return this._exportResponsesUseCase.execute(request);
	}

	public async listResponsesForModeration(request: ListResponsesForModerationUseCaseRequest): Promise<ReturnType<ListResponsesForModerationUseCase['execute']>> {
		return this._listResponsesForModerationUseCase.execute(request);
	}

	public async moderateResponse(request: ModerateResponseUseCaseRequest): Promise<ReturnType<ModerateResponseUseCase['execute']>> {
		return this._moderateResponseUseCase.execute(request);
	}
}
