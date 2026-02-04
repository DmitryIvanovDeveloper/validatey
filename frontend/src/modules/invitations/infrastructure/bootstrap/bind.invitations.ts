import { Container } from 'inversify';
import { TYPES } from './types';
import { InvitationRepositoryPort } from '../../application/ports/invitation-repository.port';
import { InvitationRepository } from '../repositories/invitation.repository';
import { InvitationServicePort } from '../../application/services/invitation-service.port';
import { InvitationService } from '../../application/services/invitation.service';
import { InvitationPresenter } from '../../interface-adapters/presenters/invitation.presenter';

export function bindInvitations(container: Container): void {
  container.bind<InvitationRepositoryPort>(TYPES.InvitationRepository).to(InvitationRepository);
  container.bind<InvitationServicePort>(TYPES.InvitationService).to(InvitationService);
  container.bind<InvitationPresenter>(TYPES.InvitationPresenter).to(InvitationPresenter);
}



