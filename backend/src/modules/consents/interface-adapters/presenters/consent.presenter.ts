import { injectable, inject } from 'inversify';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { RecordConsentUseCase } from '../../application/use-cases/record-consent.use-case';
import { GetConsentRequirementsUseCase } from '../../application/use-cases/get-consent-requirements.use-case';
import { ExportConsentsUseCase } from '../../application/use-cases/export-consents.use-case';
import { RecordConsentUseCaseRequest } from '../../application/use-cases/input-output/record-consent.io';
import { GetConsentRequirementsUseCaseRequest } from '../../application/use-cases/input-output/get-consent-requirements.io';
import { ExportConsentsUseCaseRequest } from '../../application/use-cases/input-output/export-consents.io';

@injectable()
export class ConsentPresenter {
  constructor(
    @inject(TYPES.RecordConsentUseCase)
    private readonly _recordConsentUseCase: RecordConsentUseCase,
    @inject(TYPES.GetConsentRequirementsUseCase)
    private readonly _getConsentRequirementsUseCase: GetConsentRequirementsUseCase,
    @inject(TYPES.ExportConsentsUseCase)
    private readonly _exportConsentsUseCase: ExportConsentsUseCase
  ) {}

  async recordConsent(request: RecordConsentUseCaseRequest) {
    return await this._recordConsentUseCase.execute(request);
  }

  async getConsentRequirements(request: GetConsentRequirementsUseCaseRequest) {
    return await this._getConsentRequirementsUseCase.execute(request);
  }

  async exportConsents(request: ExportConsentsUseCaseRequest) {
    return await this._exportConsentsUseCase.execute(request);
  }
}
