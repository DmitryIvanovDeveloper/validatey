export const TYPES = {
  DeletionRequestRepository: Symbol.for('DeletionRequestRepository'),
  NotificationService: Symbol.for('DeletionRequestNotificationService'),
  PiiDeletion: Symbol.for('PiiDeletion'),
  CreateDeletionRequestUseCase: Symbol.for('CreateDeletionRequestUseCase'),
  ListDeletionRequestsByProjectUseCase: Symbol.for('ListDeletionRequestsByProjectUseCase'),
  ExecuteDeletionRequestUseCase: Symbol.for('ExecuteDeletionRequestUseCase'),
  DeletionRequestController: Symbol.for('DeletionRequestController'),
} as const;
