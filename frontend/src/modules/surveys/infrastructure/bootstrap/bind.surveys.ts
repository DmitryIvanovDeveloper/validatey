import { Container } from 'inversify';
import { TYPES } from './types';
import { SurveyRepositoryPort } from '../../application/ports/survey-repository.port';
import { SurveyRepository } from '../repositories/survey.repository';
import { GetSurveyByTokenUseCase } from '../../application/use-cases/get-survey-by-token.use-case';
import { SurveyPresenter } from '../../interface-adapters/presenters/survey.presenter';

export function bindSurveys(container: Container): void {
  container.bind<SurveyRepositoryPort>(TYPES.SurveyRepository).to(SurveyRepository);
  container.bind<GetSurveyByTokenUseCase>(TYPES.GetSurveyByTokenUseCase).to(GetSurveyByTokenUseCase);
  container.bind<SurveyPresenter>(TYPES.SurveyPresenter).to(SurveyPresenter);
}

