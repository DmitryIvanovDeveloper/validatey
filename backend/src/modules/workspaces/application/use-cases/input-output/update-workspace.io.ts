export type UpdateWorkspaceUseCaseRequest = {
  workspaceId: string;
  userId: string; // for access control
  name: string;
  iconUrl?: string | null;
};

export type UpdateWorkspaceUseCaseResponse = {
  workspace: {
    id: string;
    userId: string;
    name: string;
    iconUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
};