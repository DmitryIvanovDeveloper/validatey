export type CreateProjectUseCaseRequest = {
  name: string;
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



