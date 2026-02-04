import Result from '../../../../infrastructure/result/result';
import { Invitation } from '../../domain/entities/invitation.entity';
import { InvitationNotFoundError, InvalidTokenError, InvitationSendError } from '../../domain/errors/invitation.error';

export interface InvitationRepositoryPort {
  getByToken(token: string): Promise<Result<Invitation, InvalidTokenError>>;
  create(projectId: string, emails: string[]): Promise<Result<Invitation[], InvitationSendError>>;
  getStatuses(projectId: string): Promise<Result<Invitation[], never>>;
  send(projectId: string, invitationIds?: string[]): Promise<Result<{ sent: number; failed: number; errors?: string[] }, InvitationSendError>>;
}



