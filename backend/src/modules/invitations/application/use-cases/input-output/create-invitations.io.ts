import { Invitation } from '../../../domain/entities/invitation.entity';

export type CreateInvitationsUseCaseRequest = {
  projectId: string;
  contacts: Array<{
    email?: string;
    phone?: string;
  }>;
};

export type CreateInvitationsUseCaseResponse = {
  invitations: Invitation[];
};


