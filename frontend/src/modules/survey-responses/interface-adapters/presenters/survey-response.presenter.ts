import { injectable, inject } from 'inversify';
import type { SubmitAnswerUseCase } from '../../application/use-cases/submit-answer.use-case';
import { SurveyResponseViewModel } from '../view-models/survey-response.view-model';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';

@injectable()
export class SurveyResponsePresenter {
  constructor(
    @inject(TYPES.SubmitAnswerUseCase)
    private readonly _submitAnswerUseCase: SubmitAnswerUseCase,
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}

  async submitAnswer(token: string, questionId: string, value: string | number, audioUrl: string | undefined, viewModel: SurveyResponseViewModel): Promise<void> {
    viewModel.loading.value = true;
    viewModel.error.value = null;

    const result = await this._submitAnswerUseCase.execute({ token, questionId, value, audioUrl });

    if (result.isSuccess) {
      viewModel.loading.value = false;
      this._logger.info('Answer submitted', { questionId });
    } else {
      viewModel.error.value = result.error.message;
      viewModel.loading.value = false;
      this._logger.error('Failed to submit answer', { questionId, error: result.error });
    }
  }
}

