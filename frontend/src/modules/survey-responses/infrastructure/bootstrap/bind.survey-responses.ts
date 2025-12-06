import { Container } from 'inversify';
import { TYPES } from './types';
import { SurveyResponseRepositoryPort } from '../../application/ports/survey-response-repository.port';
import { SurveyResponseRepository } from '../repositories/survey-response.repository';
import { SubmitAnswerUseCase } from '../../application/use-cases/submit-answer.use-case';
import { SurveyResponsePresenter } from '../../interface-adapters/presenters/survey-response.presenter';

export function bindSurveyResponses(container: Container): void {
  container.bind<SurveyResponseRepositoryPort>(TYPES.SurveyResponseRepository).to(SurveyResponseRepository);
  container.bind<SubmitAnswerUseCase>(TYPES.SubmitAnswerUseCase).to(SubmitAnswerUseCase);
  container.bind<SurveyResponsePresenter>(TYPES.SurveyResponsePresenter).to(SurveyResponsePresenter);
}

