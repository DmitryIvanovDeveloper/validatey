import { injectable, inject } from 'inversify';
import ResultEx from '../../../../infrastructure/result/result';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { GetSurveyByTokenUseCase } from '../../application/use-cases/get-survey-by-token.use-case';
import { GetSurveyByTokenUseCaseRequest } from '../../application/use-cases/input-output/get-survey-by-token.io';
import { TYPES as CONSENT_TYPES } from '../../../consents/infrastructure/bootstrap/types';
import { GetConsentRequirementsUseCase } from '../../../consents/application/use-cases/get-consent-requirements.use-case';

@injectable()
export class SurveyPresenter {
  constructor(
    @inject(TYPES.GetSurveyByTokenUseCase)
    private readonly _getSurveyByTokenUseCase: GetSurveyByTokenUseCase,
    @inject(CONSENT_TYPES.GetConsentRequirementsUseCase)
    private readonly _getConsentRequirementsUseCase: GetConsentRequirementsUseCase
  ) {}

  async getSurveyByToken(request: GetSurveyByTokenUseCaseRequest) {
    const result = await this._getSurveyByTokenUseCase.execute(request);
    if (!result.isSuccess) return result;

    const consentResult = await this._getConsentRequirementsUseCase.execute({ token: request.token });
    const consent = consentResult.isSuccess
      ? consentResult.data
      : {
          consentRequired: false,
          consentText: '',
          dataUsageText: '',
          alreadyConsented: false,
        };

    return ResultEx.success({
      ...result.data,
      consentRequired: consent.consentRequired,
      consentText: consent.consentText,
      dataUsageText: consent.dataUsageText,
      alreadyConsented: consent.alreadyConsented,
    });
  }
}



