import { injectable, inject } from 'inversify';
import type { GetSurveyByTokenUseCase } from '../../application/use-cases/get-survey-by-token.use-case';
import { SurveyViewModel } from '../view-models/survey.view-model';
import { Survey, SurveyStatus } from '../../domain/entities/survey.entity';
import { SurveyQuestion, QuestionType } from '../../domain/value-objects/survey-question.vo';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';

@injectable()
export class SurveyPresenter {
  constructor(
    @inject(TYPES.GetSurveyByTokenUseCase)
    private readonly _getSurveyByTokenUseCase: GetSurveyByTokenUseCase,
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}

  async loadSurvey(token: string, viewModel: SurveyViewModel): Promise<void> {
    viewModel.loading.value = true;
    viewModel.error.value = null;

    const result = await this._getSurveyByTokenUseCase.execute({ token });

    if (result.isSuccess) {
      // Map response to Survey entity
      const surveyData = result.data.survey;
      const questions = surveyData.questions.map(q => 
        new SurveyQuestion(q.id, q.type as QuestionType, q.text, q.required)
      );
      
      const survey = new Survey(
        surveyData.id,
        surveyData.token,
        surveyData.projectId,
        questions,
        surveyData.status as SurveyStatus,
        null,
        null
      );
      
      viewModel.survey.value = survey;
      viewModel.loading.value = false;
      this._logger.info('Survey loaded', { token });
    } else {
      viewModel.error.value = result.error.message;
      viewModel.loading.value = false;
      this._logger.error('Failed to load survey', { token, error: result.error });
    }
  }
}

