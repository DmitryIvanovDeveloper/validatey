export type GetWorkspaceUseCaseRequest = {
  workspaceId: string;
  userId: string; // for access control
};

export type GetWorkspaceUseCaseResponse = {
  workspace: {
    id: string;
    userId: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  };
};