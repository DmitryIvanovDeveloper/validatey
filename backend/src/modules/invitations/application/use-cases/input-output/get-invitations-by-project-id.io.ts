import { Invitation } from '../../../domain/entities/invitation.entity';

export type GetInvitationsByProjectIdUseCaseRequest = {
  projectId: string;
};

export type GetInvitationsByProjectIdUseCaseResponse = {
  invitations: Array<{
    id: string;
    projectId: string;
    token: string;
    email: string;
    status: string;
    sentAt: Date | null;
    respondedAt: Date | null;
  }>;
};
