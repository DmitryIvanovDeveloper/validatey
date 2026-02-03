import { Invitation } from '../../../domain/entities/invitation.entity';

export type GetInvitationByTokenUseCaseRequest = {
  token: string;
};

export type GetInvitationByTokenUseCaseResponse = {
  invitation: Invitation;
};



