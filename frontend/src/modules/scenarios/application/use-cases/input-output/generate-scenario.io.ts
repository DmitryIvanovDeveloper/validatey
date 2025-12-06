export type GenerateScenarioUseCaseRequest = {
  projectId: string;
  segment?: {
    description: string;
    demographics: Record<string, any>;
  } | null;
  hypothesis?: {
    description: string;
    assumptions: string[];
  } | null;
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
