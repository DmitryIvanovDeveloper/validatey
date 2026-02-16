export type ListWorkspacesUseCaseRequest = {
  userId: string;
};

export type ListWorkspacesUseCaseResponse = {
  workspaces: {
    id: string;
    userId: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  }[];
};