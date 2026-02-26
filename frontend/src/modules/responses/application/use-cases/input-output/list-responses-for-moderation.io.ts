export interface ListResponsesForModerationUseCaseRequest {
  projectId: string;
}

export interface ListResponsesForModerationUseCaseResponse {
  responses: Array<{
    id: string;
    invitationId: string;
    projectId: string;
    answers: Record<string, unknown>;
    audioUrl: string | null;
    transcript: string | null;
    moderationStatus: 'pending' | 'approved' | 'rejected' | null;
    questionLabels: Record<string, string>;
    createdAt: Date;
    updatedAt: Date;
    wordCount?: number;
    hasAudio?: boolean;
    hasTranscript?: boolean;
  }>;
  error?: string;
}