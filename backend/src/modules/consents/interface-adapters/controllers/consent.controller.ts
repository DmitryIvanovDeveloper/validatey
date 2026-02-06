import { injectable, inject } from 'inversify';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { RecordConsentUseCase } from '../../application/use-cases/record-consent.use-case';
import { GetConsentRequirementsUseCase } from '../../application/use-cases/get-consent-requirements.use-case';
import { ExportConsentsUseCase } from '../../application/use-cases/export-consents.use-case';
import { RecordConsentUseCaseRequest } from '../../application/use-cases/input-output/record-consent.io';
import { GetConsentRequirementsUseCaseRequest } from '../../application/use-cases/input-output/get-consent-requirements.io';
import { ExportConsentsUseCaseRequest } from '../../application/use-cases/input-output/export-consents.io';

@injectable()
export class ConsentController {
	constructor(
		@inject(TYPES.RecordConsentUseCase)
		private readonly _recordConsentUseCase: RecordConsentUseCase,
		@inject(TYPES.GetConsentRequirementsUseCase)
		private readonly _getConsentRequirementsUseCase: GetConsentRequirementsUseCase,
		@inject(TYPES.ExportConsentsUseCase)
		private readonly _exportConsentsUseCase: ExportConsentsUseCase
	) {}

	public async recordConsent(request: RecordConsentUseCaseRequest): Promise<ReturnType<RecordConsentUseCase['execute']>> {
		return this._recordConsentUseCase.execute(request);
	}

	public async getConsentRequirements(request: GetConsentRequirementsUseCaseRequest): Promise<ReturnType<GetConsentRequirementsUseCase['execute']>> {
		return this._getConsentRequirementsUseCase.execute(request);
	}

	public async exportConsents(request: ExportConsentsUseCaseRequest): Promise<ReturnType<ExportConsentsUseCase['execute']>> {
		return this._exportConsentsUseCase.execute(request);
	}
}
