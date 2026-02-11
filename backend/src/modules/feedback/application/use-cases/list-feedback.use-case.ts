import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import type { GetUserRolePort } from '../../../auth/application/ports/get-user-role.port';
import { AUTH_TYPES } from '../../../auth/infrastructure/bootstrap/types';
import type { FeedbackRepositoryPort } from '../ports/feedback-repository.port';
import { AdminAccessDeniedError } from '../../../admin/domain/errors/admin.error';
import { ListFeedbackUseCaseRequest, ListFeedbackUseCaseResponse } from './input-output/list-feedback.io';
import { TYPES } from '../../infrastructure/bootstrap/types';

@injectable()
export class ListFeedbackUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(AUTH_TYPES.GetUserRole)
    private readonly _getUserRole: GetUserRolePort,
    @inject(TYPES.FeedbackRepository)
    private readonly _repository: FeedbackRepositoryPort
  ) {}

  async execute(
    request: ListFeedbackUseCaseRequest
  ): Promise<ResultEx<ListFeedbackUseCaseResponse, AdminAccessDeniedError | Error>> {
    this._logger.info('list-feedback.start', { callerUserId: request.callerUserId });

    const role = await this._getUserRole.getRole(request.callerUserId);
    if (role !== 'admin') {
      this._logger.warn('list-feedback.access-denied', { callerUserId: request.callerUserId });
      return ResultEx.failure(new AdminAccessDeniedError(request.callerUserId));
    }

    const listResult = await this._repository.list();
    if (!listResult.isSuccess) {
      this._logger.error('list-feedback.list-error', { error: listResult.error });
      return ResultEx.failure(listResult.error);
    }

    this._logger.info('list-feedback.success', { count: listResult.data.length });
    return ResultEx.success({ feedback: listResult.data });
  }
}
