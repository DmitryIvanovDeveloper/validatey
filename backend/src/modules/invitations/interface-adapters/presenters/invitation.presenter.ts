import { injectable, inject } from 'inversify';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { CreateInvitationsUseCase } from '../../application/use-cases/create-invitations.use-case';
import { GetInvitationByTokenUseCase } from '../../application/use-cases/get-invitation-by-token.use-case';
import { UpdateInvitationStatusUseCase } from '../../application/use-cases/update-invitation-status.use-case';
import { CreateInvitationsUseCaseRequest } from '../../application/use-cases/input-output/create-invitations.io';
import { GetInvitationByTokenUseCaseRequest } from '../../application/use-cases/input-output/get-invitation-by-token.io';
import { UpdateInvitationStatusUseCaseRequest } from '../../application/use-cases/input-output/update-invitation-status.io';

@injectable()
export class InvitationPresenter {
  constructor(
    @inject(TYPES.CreateInvitationsUseCase)
    private readonly _createInvitationsUseCase: CreateInvitationsUseCase,
    @inject(TYPES.GetInvitationByTokenUseCase)
    private readonly _getInvitationByTokenUseCase: GetInvitationByTokenUseCase,
    @inject(TYPES.UpdateInvitationStatusUseCase)
    private readonly _updateInvitationStatusUseCase: UpdateInvitationStatusUseCase
  ) {}

  async createInvitations(request: CreateInvitationsUseCaseRequest) {
    return await this._createInvitationsUseCase.execute(request);
  }

  async getInvitationByToken(request: GetInvitationByTokenUseCaseRequest) {
    return await this._getInvitationByTokenUseCase.execute(request);
  }

  async updateInvitationStatus(request: UpdateInvitationStatusUseCaseRequest) {
    return await this._updateInvitationStatusUseCase.execute(request);
  }
}

