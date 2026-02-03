import ResultEx from '../../../../infrastructure/result/result';
import { Invitation } from '../../domain/entities/invitation.entity';
import { InvitationNotFoundError, InvalidInvitationDataError } from '../../domain/errors/invitation.error';

export interface InvitationRepositoryPort {
  create(invitation: Invitation): Promise<ResultEx<Invitation, InvalidInvitationDataError>>;
  findById(id: string): Promise<ResultEx<Invitation, InvitationNotFoundError>>;
  findByToken(token: string): Promise<ResultEx<Invitation, InvitationNotFoundError>>;
  findByProjectId(projectId: string): Promise<ResultEx<Invitation[], Error>>;
  update(invitation: Invitation): Promise<ResultEx<Invitation, InvitationNotFoundError | InvalidInvitationDataError>>;
  createMany(invitations: Invitation[]): Promise<ResultEx<Invitation[], InvalidInvitationDataError>>;
}



