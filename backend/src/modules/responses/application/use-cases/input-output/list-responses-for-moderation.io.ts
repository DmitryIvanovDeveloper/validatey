import type { ModerationStatus } from '../../../domain/entities/response.entity';

export type ListResponsesForModerationUseCaseRequest = {
  projectId: string;
  userId: string;
  moderationStatus?: ModerationStatus | null;
};

export type ListResponsesForModerationUseCaseResponse = {
  responses: Array<{
    id: string;
    invitationId: string;
    projectId: string;
    answers: Record<string, any>;
    audioUrl: string | null;
    transcript: string | null;
    moderationStatus: ModerationStatus | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
};
