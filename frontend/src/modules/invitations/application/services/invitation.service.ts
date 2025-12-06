import { injectable, inject } from 'inversify';
import { InvitationServicePort } from './invitation-service.port';
import type { InvitationRepositoryPort } from '../ports/invitation-repository.port';
import Result from '../../../../infrastructure/result/result';
import { Invitation } from '../../domain/entities/invitation.entity';
import { InvalidTokenError } from '../../domain/errors/invitation.error';
import { TYPES } from '../../infrastructure/bootstrap/types';

@injectable()
export class InvitationService implements InvitationServicePort {
  constructor(
    @inject(TYPES.InvitationRepository)
    private readonly _repository: InvitationRepositoryPort
  ) {}

  async validateToken(token: string): Promise<Result<Invitation, InvalidTokenError>> {
    return await this._repository.getByToken(token);
  }
}

