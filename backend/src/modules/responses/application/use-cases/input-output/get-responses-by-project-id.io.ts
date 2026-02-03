export type GetResponsesByProjectIdUseCaseRequest = {
  projectId: string;
};

export type GetResponsesByProjectIdUseCaseResponse = {
  responses: Array<{
    id: string;
    invitationId: string;
    projectId: string;
    answers: Record<string, any>;
    audioUrl: string | null;
    transcript: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
};
