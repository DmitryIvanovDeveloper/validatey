import { Container } from 'inversify';
import { TYPES } from './types';
import { InvitationRepositoryPort } from '../../application/ports/invitation-repository.port';
import { InvitationRepository } from '../repositories/invitation.repository';
import { InvitationServicePort } from '../../application/services/invitation-service.port';
import { InvitationService } from '../../application/services/invitation.service';

export function bindInvitations(container: Container): void {
  container.bind<InvitationRepositoryPort>(TYPES.InvitationRepository).to(InvitationRepository);
  container.bind<InvitationServicePort>(TYPES.InvitationService).to(InvitationService);
}

