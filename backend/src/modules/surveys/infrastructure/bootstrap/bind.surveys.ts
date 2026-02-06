import { Container } from 'inversify';
import { TYPES } from './types';
import { GetSurveyByTokenUseCase } from '../../application/use-cases/get-survey-by-token.use-case';
import { SurveyController } from '../../interface-adapters/controllers/survey.controller';

export function bindSurveys(container: Container): void {
  // Use Cases
  container.bind<GetSurveyByTokenUseCase>(TYPES.GetSurveyByTokenUseCase).to(GetSurveyByTokenUseCase);

  // Controller
  container.bind<SurveyController>(TYPES.SurveyController).to(SurveyController);
}



