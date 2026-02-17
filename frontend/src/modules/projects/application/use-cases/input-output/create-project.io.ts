export type CreateProjectUseCaseRequest = {
  name: string;
  workspaceId?: string | null;
};

export type CreateProjectUseCaseResponse = {
  project: {
    id: string;
    name: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
};



