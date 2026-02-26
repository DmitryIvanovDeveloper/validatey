export type MarketContextForScenario = {
  marketPicture?: string;
  marketFit?: string;
  differentiation?: string;
} | null;

export type GenerateScenarioUseCaseRequest = {
  projectId: string;
  segment?: {
    description: string;
    demographics: Record<string, unknown>;
  } | null;
  hypothesis?: {
    description: string;
    assumptions: string[];
  } | null;
  marketContext?: MarketContextForScenario;
  templateSlug?: string;
  prompt?: string;
};

export type GenerateScenarioUseCaseResponse = {
  scenario: {
    id: string;
    projectId: string;
    content: string;
    version: number;
    status: string;
    createdAt: string; // ISO 8601 string
  };
};
