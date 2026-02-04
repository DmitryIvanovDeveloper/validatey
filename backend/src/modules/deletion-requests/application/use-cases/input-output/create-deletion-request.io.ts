export type CreateDeletionRequestUseCaseRequest = {
  projectId: string;
  identifier: string;
  requestedBy?: string | null;
};

export type CreateDeletionRequestUseCaseResponse = {
  request: {
    id: string;
    projectId: string;
    identifier: string;
    status: string;
    requestedAt: Date;
  };
};
