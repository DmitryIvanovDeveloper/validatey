import { Container } from 'inversify';
import { TYPES } from './types';
import { InvitationRepositoryPort } from '../../application/ports/invitation-repository.port';
import { SupabaseInvitationRepository } from '../repositories/supabase-invitation.repository';
import { EmailServicePort } from '../../application/ports/email-service.port';
import { SMTPEmailService } from '../services/smtp-email.service';
import { SMSServicePort } from '../../application/ports/sms-service.port';
import { SMSProviderService } from '../services/sms-provider.service';
import { CreateInvitationsUseCase } from '../../application/use-cases/create-invitations.use-case';
import { GetInvitationByTokenUseCase } from '../../application/use-cases/get-invitation-by-token.use-case';
import { GetInvitationsByProjectIdUseCase } from '../../application/use-cases/get-invitations-by-project-id.use-case';
import { UpdateInvitationStatusUseCase } from '../../application/use-cases/update-invitation-status.use-case';
import { SendInvitationsUseCase } from '../../application/use-cases/send-invitations.use-case';
import { InvitationPresenter } from '../../interface-adapters/presenters/invitation.presenter';

export function bindInvitations(container: Container): void {
  // Repository
  container.bind<InvitationRepositoryPort>(TYPES.InvitationRepository).to(SupabaseInvitationRepository);

  // Services
  container.bind<EmailServicePort>(TYPES.EmailService).to(SMTPEmailService);
  container.bind<SMSServicePort>(TYPES.SMSService).to(SMSProviderService);

  // Use Cases
  container.bind<CreateInvitationsUseCase>(TYPES.CreateInvitationsUseCase).to(CreateInvitationsUseCase);
  container.bind<GetInvitationByTokenUseCase>(TYPES.GetInvitationByTokenUseCase).to(GetInvitationByTokenUseCase);
  container.bind<GetInvitationsByProjectIdUseCase>(TYPES.GetInvitationsByProjectIdUseCase).to(GetInvitationsByProjectIdUseCase);
  container.bind<UpdateInvitationStatusUseCase>(TYPES.UpdateInvitationStatusUseCase).to(UpdateInvitationStatusUseCase);
  container.bind<SendInvitationsUseCase>(TYPES.SendInvitationsUseCase).to(SendInvitationsUseCase);

  // Presenter
  container.bind<InvitationPresenter>(TYPES.InvitationPresenter).to(InvitationPresenter);
}



