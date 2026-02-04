import ResultEx from '../../../../infrastructure/result/result';

export interface DeletionRequestNotificationPayload {
  projectId: string;
  projectName?: string;
  requestId: string;
  identifier: string;
  requestedAt: Date;
}

/** Sends notification about a new deletion request. Implementation resolves recipient (e.g. project owner) from projectId. */
export interface NotificationServicePort {
  sendDeletionRequestNotification(
    projectId: string,
    payload: DeletionRequestNotificationPayload
  ): Promise<ResultEx<void, Error>>;
}
