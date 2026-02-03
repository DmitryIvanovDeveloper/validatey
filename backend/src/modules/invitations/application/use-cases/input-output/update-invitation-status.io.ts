import { InvitationStatus } from '../../../domain/entities/invitation.entity';

export type UpdateInvitationStatusUseCaseRequest = {
  invitationId: string;
  status: InvitationStatus;
};

export type UpdateInvitationStatusUseCaseResponse = {
  invitation: {
    id: string;
    projectId: string;
    token: string;
    email: string | null;
    phone: string | null;
    status: InvitationStatus;
    sentAt: Date | null;
    openedAt: Date | null;
    completedAt: Date | null;
    reminderCount: number;
    createdAt: Date;
    updatedAt: Date;
  };
};



