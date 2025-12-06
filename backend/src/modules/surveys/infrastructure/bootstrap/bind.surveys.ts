import { Container } from 'inversify';
import { TYPES } from './types';
import { GetSurveyByTokenUseCase } from '../../application/use-cases/get-survey-by-token.use-case';
import { SurveyPresenter } from '../../interface-adapters/presenters/survey.presenter';

export function bindSurveys(container: Container): void {
  // Use Cases
  container.bind<GetSurveyByTokenUseCase>(TYPES.GetSurveyByTokenUseCase).to(GetSurveyByTokenUseCase);

  // Presenter
  container.bind<SurveyPresenter>(TYPES.SurveyPresenter).to(SurveyPresenter);
}

