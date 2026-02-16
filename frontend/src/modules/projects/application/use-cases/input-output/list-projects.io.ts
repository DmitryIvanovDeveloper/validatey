export type ListProjectsUseCaseRequest = {
  workspaceId?: string;
};

export type ListProjectsUseCaseResponse = {
  projects: Array<{
    id: string;
    name: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  }>;
};



