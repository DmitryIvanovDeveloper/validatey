export type CreateWorkspaceUseCaseRequest = {
  userId: string;
  name: string;
};

export type CreateWorkspaceUseCaseResponse = {
  workspace: {
    id: string;
    userId: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  };
};