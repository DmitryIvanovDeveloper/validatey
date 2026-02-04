import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { NotificationServicePort } from '../../application/ports/notification-service.port';

/**
 * Logs deletion request notifications. Replace with email adapter (e.g. using EmailServicePort)
 * when project owner email is available (e.g. from auth or user profile).
 */
@injectable()
export class DeletionRequestNotificationAdapter implements NotificationServicePort {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}

  async sendDeletionRequestNotification(
    _projectId: string,
    payload: { projectId: string; requestId: string; identifier: string; requestedAt: Date }
  ): Promise<ResultEx<void, Error>> {
    this._logger.info('deletion-request-notification.sent', {
      projectId: payload.projectId,
      requestId: payload.requestId,
      identifier: payload.identifier,
      requestedAt: payload.requestedAt.toISOString(),
      hint: 'Configure email adapter to notify project owner',
    });
    return ResultEx.success(undefined);
  }
}
