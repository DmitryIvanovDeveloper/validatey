import type { GetResponsesOptions } from '../../ports/response-repository.port';

export interface GetResponsesUseCaseRequest {
  projectId: string;
  options?: GetResponsesOptions;
}

export interface GetResponsesUseCaseResponse {
  responses: Array<{
    id: string;
    invitationId: string;
    projectId: string;
    answers: Record<string, any>;
    audioUrl: string | null;
    transcript: string | null;
    moderationStatus: 'pending' | 'approved' | 'rejected' | null;
    createdAt: Date;
    updatedAt: Date;
    wordCount?: number;
    hasAudio?: boolean;
    hasTranscript?: boolean;
  }>;
  total: number;
  summary: {
    total: number;
    responded: number;
    pendingModeration: number;
    averageWordCount: number;
  };
  error?: string;
}