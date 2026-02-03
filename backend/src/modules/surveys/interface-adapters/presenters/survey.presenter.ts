import { injectable, inject } from 'inversify';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { GetSurveyByTokenUseCase } from '../../application/use-cases/get-survey-by-token.use-case';
import { GetSurveyByTokenUseCaseRequest } from '../../application/use-cases/input-output/get-survey-by-token.io';

@injectable()
export class SurveyPresenter {
  constructor(
    @inject(TYPES.GetSurveyByTokenUseCase)
    private readonly _getSurveyByTokenUseCase: GetSurveyByTokenUseCase
  ) {}

  async getSurveyByToken(request: GetSurveyByTokenUseCaseRequest) {
    return await this._getSurveyByTokenUseCase.execute(request);
  }
}



