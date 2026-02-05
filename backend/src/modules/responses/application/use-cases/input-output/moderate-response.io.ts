import type { ModerationStatus } from '../../../domain/entities/response.entity';

export type ModerateResponseUseCaseRequest = {
  responseId: string;
  userId: string;
  status: 'approved' | 'rejected';
};

export type ModerateResponseUseCaseResponse = {
  response: {
    id: string;
    invitationId: string;
    projectId: string;
    answers: Record<string, any>;
    audioUrl: string | null;
    transcript: string | null;
    moderationStatus: ModerationStatus;
    createdAt: Date;
    updatedAt: Date;
  };
};
