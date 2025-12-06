export type ListProjectsUseCaseRequest = {};

export type ListProjectsUseCaseResponse = {
  projects: Array<{
    id: string;
    name: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  }>;
};

