import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import type { FeedbackRepositoryPort } from '../ports/feedback-repository.port';
import type { Feedback, FeedbackType } from '../../domain/entities/feedback.entity';
import { FeedbackValidationError } from '../../domain/errors/feedback.error';
import { SubmitFeedbackUseCaseRequest, SubmitFeedbackUseCaseResponse } from './input-output/submit-feedback.io';
import { TYPES } from '../../infrastructure/bootstrap/types';

const VALID_TYPES: FeedbackType[] = ['feature_request', 'bug_report', 'what_is_missing', 'other'];

@injectable()
export class SubmitFeedbackUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(TYPES.FeedbackRepository)
    private readonly _repository: FeedbackRepositoryPort
  ) {}

  async execute(
    request: SubmitFeedbackUseCaseRequest
  ): Promise<ResultEx<SubmitFeedbackUseCaseResponse, FeedbackValidationError | Error>> {
    this._logger.info('submit-feedback.start', { callerUserId: request.callerUserId, type: request.type });

    const trimmed = (request.text ?? '').trim();
    if (!trimmed) {
      return ResultEx.failure(new FeedbackValidationError('Text is required'));
    }
    if (!VALID_TYPES.includes(request.type)) {
      return ResultEx.failure(new FeedbackValidationError(`Invalid type: ${request.type}`));
    }

    const feedback: Feedback = {
      id: crypto.randomUUID(),
      type: request.type,
      text: trimmed,
      screenshotUrl: request.screenshotUrl ?? null,
      userId: request.callerUserId ?? null,
      pageUrl: request.pageUrl ?? null,
      createdAt: new Date(),
    };

    const saveResult = await this._repository.save(feedback);
    if (!saveResult.isSuccess) {
      this._logger.error('submit-feedback.save-error', { error: saveResult.error });
      return ResultEx.failure(saveResult.error);
    }

    this._logger.info('submit-feedback.success', { id: feedback.id });
    return ResultEx.success({ id: feedback.id });
  }
}
