export type GetProjectUseCaseRequest = {
  projectId: string;
  /** When set, request is made as guest (no auth); backend validates slug. */
  guestSlug?: string;
};

export type GetProjectUseCaseResponse = {
  project: {
    id: string;
    name: string;
    segment: {
      description: string;
      demographics: Record<string, unknown>;
    } | null;
    hypothesis: {
      description: string;
      assumptions: Array<{ id: string; text: string }>;
    } | null;
    marketContext: { marketPicture?: string; marketFit?: string; differentiation?: string } | null;
    status: string;
    createdAt: string;
    updatedAt: string;
    publicAccessEnabled?: boolean;
    publicSlug?: string | null;
    maxPublicResponses?: number | null;
    requirePublicEmail?: boolean;
    captchaEnabled?: boolean;
    scenarioTemplateSlug?: string | null;
  };
};



