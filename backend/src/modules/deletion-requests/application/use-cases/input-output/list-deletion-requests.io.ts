export type ListDeletionRequestsByProjectUseCaseRequest = {
  projectId: string;
};

export type ListDeletionRequestsByProjectUseCaseResponse = {
  requests: Array<{
    id: string;
    projectId: string;
    identifier: string;
    status: string;
    requestedAt: Date;
    completedAt: Date | null;
    requestedBy: string | null;
    createdAt: Date;
  }>;
};
