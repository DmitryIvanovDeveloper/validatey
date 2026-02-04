import { Container } from 'inversify';
import { TYPES } from './types';
import { DeletionRequestRepositoryPort } from '../../application/ports/deletion-request-repository.port';
import { NotificationServicePort } from '../../application/ports/notification-service.port';
import { PiiDeletionPort } from '../../application/ports/pii-deletion.port';
import { SupabaseDeletionRequestRepository } from '../repositories/supabase-deletion-request.repository';
import { DeletionRequestNotificationAdapter } from '../services/deletion-request-notification.adapter';
import { InvitationPiiDeletionAdapter } from '../services/invitation-pii-deletion.adapter';
import { CreateDeletionRequestUseCase } from '../../application/use-cases/create-deletion-request.use-case';
import { ListDeletionRequestsByProjectUseCase } from '../../application/use-cases/list-deletion-requests-by-project.use-case';
import { ExecuteDeletionRequestUseCase } from '../../application/use-cases/execute-deletion-request.use-case';
import { DeletionRequestPresenter } from '../../interface-adapters/presenters/deletion-request.presenter';

export function bindDeletionRequests(container: Container): void {
  container.bind<DeletionRequestRepositoryPort>(TYPES.DeletionRequestRepository).to(SupabaseDeletionRequestRepository);
  container.bind<NotificationServicePort>(TYPES.NotificationService).to(DeletionRequestNotificationAdapter);
  container.bind<PiiDeletionPort>(TYPES.PiiDeletion).to(InvitationPiiDeletionAdapter);

  container.bind<CreateDeletionRequestUseCase>(TYPES.CreateDeletionRequestUseCase).to(CreateDeletionRequestUseCase);
  container.bind<ListDeletionRequestsByProjectUseCase>(TYPES.ListDeletionRequestsByProjectUseCase).to(ListDeletionRequestsByProjectUseCase);
  container.bind<ExecuteDeletionRequestUseCase>(TYPES.ExecuteDeletionRequestUseCase).to(ExecuteDeletionRequestUseCase);

  container.bind<DeletionRequestPresenter>(TYPES.DeletionRequestPresenter).to(DeletionRequestPresenter);
}
