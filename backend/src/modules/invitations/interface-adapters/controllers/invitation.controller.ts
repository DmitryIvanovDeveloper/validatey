import { injectable, inject } from 'inversify';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { CreateInvitationsUseCase } from '../../application/use-cases/create-invitations.use-case';
import { GetInvitationByTokenUseCase } from '../../application/use-cases/get-invitation-by-token.use-case';
import { GetInvitationsByProjectIdUseCase } from '../../application/use-cases/get-invitations-by-project-id.use-case';
import { UpdateInvitationStatusUseCase } from '../../application/use-cases/update-invitation-status.use-case';
import { SendInvitationsUseCase } from '../../application/use-cases/send-invitations.use-case';
import { CreateInvitationsUseCaseRequest } from '../../application/use-cases/input-output/create-invitations.io';
import { GetInvitationByTokenUseCaseRequest } from '../../application/use-cases/input-output/get-invitation-by-token.io';
import { GetInvitationsByProjectIdUseCaseRequest } from '../../application/use-cases/input-output/get-invitations-by-project-id.io';
import { UpdateInvitationStatusUseCaseRequest } from '../../application/use-cases/input-output/update-invitation-status.io';
import { SendInvitationsUseCaseInput } from '../../application/use-cases/input-output/send-invitations.io';

@injectable()
export class InvitationController {
	constructor(
		@inject(TYPES.CreateInvitationsUseCase)
		private readonly _createInvitationsUseCase: CreateInvitationsUseCase,
		@inject(TYPES.GetInvitationByTokenUseCase)
		private readonly _getInvitationByTokenUseCase: GetInvitationByTokenUseCase,
		@inject(TYPES.GetInvitationsByProjectIdUseCase)
		private readonly _getInvitationsByProjectIdUseCase: GetInvitationsByProjectIdUseCase,
		@inject(TYPES.UpdateInvitationStatusUseCase)
		private readonly _updateInvitationStatusUseCase: UpdateInvitationStatusUseCase,
		@inject(TYPES.SendInvitationsUseCase)
		private readonly _sendInvitationsUseCase: SendInvitationsUseCase
	) {}

	public async createInvitations(request: CreateInvitationsUseCaseRequest): Promise<ReturnType<CreateInvitationsUseCase['execute']>> {
		return this._createInvitationsUseCase.execute(request);
	}

	public async getInvitationByToken(request: GetInvitationByTokenUseCaseRequest): Promise<ReturnType<GetInvitationByTokenUseCase['execute']>> {
		return this._getInvitationByTokenUseCase.execute(request);
	}

	public async getInvitationsByProjectId(request: GetInvitationsByProjectIdUseCaseRequest): Promise<ReturnType<GetInvitationsByProjectIdUseCase['execute']>> {
		return this._getInvitationsByProjectIdUseCase.execute(request);
	}

	public async updateInvitationStatus(request: UpdateInvitationStatusUseCaseRequest): Promise<ReturnType<UpdateInvitationStatusUseCase['execute']>> {
		return this._updateInvitationStatusUseCase.execute(request);
	}

	public async sendInvitations(input: SendInvitationsUseCaseInput): Promise<ReturnType<SendInvitationsUseCase['execute']>> {
		return this._sendInvitationsUseCase.execute(input);
	}
}
