import Result from '../../../../infrastructure/result/result';
import { Invitation } from '../../domain/entities/invitation.entity';
import { InvalidTokenError } from '../../domain/errors/invitation.error';

export interface InvitationServicePort {
  validateToken(token: string): Promise<Result<Invitation, InvalidTokenError>>;
}



