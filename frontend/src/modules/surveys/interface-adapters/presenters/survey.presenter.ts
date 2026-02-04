import { injectable, inject } from 'inversify';
import type { GetSurveyByTokenUseCase } from '../../application/use-cases/get-survey-by-token.use-case';
import { SurveyViewModel } from '../view-models/survey.view-model';
import { Survey, SurveyStatus } from '../../domain/entities/survey.entity';
import { SurveyQuestion, QuestionType } from '../../domain/value-objects/survey-question.vo';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import type { SurveyRepositoryPort } from '../../application/ports/survey-repository.port';

@injectable()
export class SurveyPresenter {
  constructor(
    @inject(TYPES.GetSurveyByTokenUseCase)
    private readonly _getSurveyByTokenUseCase: GetSurveyByTokenUseCase,
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(TYPES.SurveyRepository)
    private readonly _surveyRepository: SurveyRepositoryPort
  ) {}

  async loadSurvey(token: string, viewModel: SurveyViewModel): Promise<void> {
    viewModel.loading.value = true;
    viewModel.error.value = null;

    const result = await this._getSurveyByTokenUseCase.execute({ token });

    if (result.isSuccess) {
      const data = result.data;
      const surveyData = data.survey;
      const questions = surveyData.questions.map(q =>
        new SurveyQuestion(
          q.id,
          q.type as QuestionType,
          q.text,
          q.required,
          q.options
        )
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
      viewModel.consentRequired.value = data.consentRequired ?? false;
      viewModel.consentText.value = data.consentText ?? '';
      viewModel.dataUsageText.value = data.dataUsageText ?? '';
      viewModel.alreadyConsented.value = data.alreadyConsented ?? false;
      viewModel.consentGiven.value = data.alreadyConsented ?? false;
      viewModel.loading.value = false;
      this._logger.info('Survey loaded', { token });
    } else {
      viewModel.error.value = result.error.message;
      viewModel.loading.value = false;
      this._logger.error('Failed to load survey', { token, error: result.error });
    }
  }

  async submitAnswers(token: string, answers: Record<string, any>): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this._surveyRepository.submitResponse(token, answers);
      
      if (result.isSuccess) {
        this._logger.info('Survey answers submitted', { token });
        return { success: true };
      } else {
        this._logger.error('Failed to submit survey answers', { token, error: result.error });
        return { success: false, error: result.error.message };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this._logger.error('Exception submitting survey answers', { token, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  async saveAnswer(token: string, questionId: string, answer: any): Promise<void> {
    // Auto-save is optional - for now just log
    this._logger.debug('Answer saved locally', { token, questionId });
  }

  async submitConsent(token: string, consentText?: string | null): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this._surveyRepository.recordConsent(token, consentText);
      if (result.isSuccess) {
        this._logger.info('Consent recorded', { token });
        return { success: true };
      }
      return { success: false, error: result.error?.message };
    } catch (error) {
      this._logger.error('Failed to record consent', { token, error });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

