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
import { CreateAnonymousInvitationForPublicLinkUseCase } from '../../application/use-cases/create-anonymous-invitation-for-public-link.use-case';
import { InvitationController } from '../../interface-adapters/controllers/invitation.controller';
// Cross-module dependencies
import { SurveyPlatformsLlmPort } from '../../../projects/application/ports/survey-platforms-llm.port';
import { SurveyPlatformsLlmAdapter } from '../../../projects/infrastructure/services/survey-platforms-llm.adapter';
import { SuggestSurveyPlatformsUseCase } from '../../application/use-cases/suggest-survey-platforms.use-case';
import { SurveyPlatformSuggestionsRepositoryPort } from '../../application/ports/survey-platform-suggestions-repository.port';
import { SupabaseSurveyPlatformSuggestionsRepository } from '../repositories/supabase-survey-platform-suggestions.repository';

export function bindInvitations(container: Container): void {
  // Repository
  container.bind<InvitationRepositoryPort>(TYPES.InvitationRepository).to(SupabaseInvitationRepository);
  container.bind<SurveyPlatformSuggestionsRepositoryPort>(TYPES.SurveyPlatformSuggestionsRepository).to(SupabaseSurveyPlatformSuggestionsRepository);

  // Services
  container.bind<EmailServicePort>(TYPES.EmailService).to(SMTPEmailService);
  container.bind<SMSServicePort>(TYPES.SMSService).to(SMSProviderService);

  // Survey Platforms components
  container.bind<SurveyPlatformsLlmPort>(TYPES.SurveyPlatformsLlm).to(SurveyPlatformsLlmAdapter);
  container.bind<SuggestSurveyPlatformsUseCase>(TYPES.SuggestSurveyPlatformsUseCase).to(SuggestSurveyPlatformsUseCase);

  // Use Cases
  container.bind<CreateInvitationsUseCase>(TYPES.CreateInvitationsUseCase).to(CreateInvitationsUseCase);
  container.bind<GetInvitationByTokenUseCase>(TYPES.GetInvitationByTokenUseCase).to(GetInvitationByTokenUseCase);
  container.bind<GetInvitationsByProjectIdUseCase>(TYPES.GetInvitationsByProjectIdUseCase).to(GetInvitationsByProjectIdUseCase);
  container.bind<UpdateInvitationStatusUseCase>(TYPES.UpdateInvitationStatusUseCase).to(UpdateInvitationStatusUseCase);
  container.bind<SendInvitationsUseCase>(TYPES.SendInvitationsUseCase).to(SendInvitationsUseCase);
  container.bind<CreateAnonymousInvitationForPublicLinkUseCase>(TYPES.CreateAnonymousInvitationForPublicLinkUseCase).to(CreateAnonymousInvitationForPublicLinkUseCase);

  // Controller
  container.bind<InvitationController>(TYPES.InvitationController).to(InvitationController);
}



