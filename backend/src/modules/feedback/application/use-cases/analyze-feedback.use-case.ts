import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import type { GetUserRolePort } from '../../../auth/application/ports/get-user-role.port';
import { AUTH_TYPES } from '../../../auth/infrastructure/bootstrap/types';
import type { FeedbackRepositoryPort } from '../ports/feedback-repository.port';
import type { FeedbackAnalysisLlmPort } from '../ports/feedback-analysis-llm.port';
import { AdminAccessDeniedError } from '../../../admin/domain/errors/admin.error';
import {
  AnalyzeFeedbackUseCaseRequest,
  AnalyzeFeedbackUseCaseResponse,
} from './input-output/analyze-feedback.io';
import { TYPES } from '../../infrastructure/bootstrap/types';

@injectable()
export class AnalyzeFeedbackUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(AUTH_TYPES.GetUserRolePort)
    private readonly _getUserRole: GetUserRolePort,
    @inject(TYPES.FeedbackRepositoryPort)
    private readonly _repository: FeedbackRepositoryPort,
    @inject(TYPES.FeedbackAnalysisLlmPort)
    private readonly _llm: FeedbackAnalysisLlmPort
  ) {}

  async execute(
    request: AnalyzeFeedbackUseCaseRequest
  ): Promise<ResultEx<AnalyzeFeedbackUseCaseResponse, AdminAccessDeniedError | Error>> {
    this._logger.info('analyze-feedback.start', { callerUserId: request.callerUserId });

    const role = await this._getUserRole.getRole(request.callerUserId);
    if (role !== 'admin') {
      this._logger.warn('analyze-feedback.access-denied', { callerUserId: request.callerUserId });
      return ResultEx.failure(new AdminAccessDeniedError(request.callerUserId));
    }

    const listResult = await this._repository.list();
    if (!listResult.isSuccess) {
      this._logger.error('analyze-feedback.list-error', { error: listResult.error });
      return ResultEx.failure(listResult.error);
    }

    const items = listResult.data.map((f) => ({ type: f.type, text: f.text }));

    if (items.length === 0) {
      this._logger.info('analyze-feedback.no-feedback');
      return ResultEx.success({
        analysis: {
          summary: 'No feedback to analyze yet.',
          themes: [],
          suggestedActions: ['Collect more user feedback to get AI insights.'],
        },
      });
    }

    const analysisResult = await this._llm.analyze(items);
    if (!analysisResult.isSuccess) {
      this._logger.error('analyze-feedback.llm-error', { error: analysisResult.error });
      return ResultEx.failure(analysisResult.error);
    }

    this._logger.info('analyze-feedback.success');
    return ResultEx.success({ analysis: analysisResult.data });
  }
}
