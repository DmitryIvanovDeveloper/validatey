export type GetProjectUseCaseRequest = {
  projectId: string;
};

export type GetProjectUseCaseResponse = {
  project: {
    id: string;
    name: string;
    segment: {
      description: string;
      demographics: Record<string, any>;
    } | null;
    hypothesis: {
      description: string;
      assumptions: string[];
    } | null;
    marketContext: { marketPicture?: string; marketFit?: string; differentiation?: string } | null;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
};



