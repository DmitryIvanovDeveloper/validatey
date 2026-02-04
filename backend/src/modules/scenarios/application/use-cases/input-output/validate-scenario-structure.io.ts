export type ValidateScenarioStructureUseCaseRequest = {
  /** Scenario JSON string or parsed object with .questions array */
  scenarioContent: string | { questions?: Array<{ id?: string; type?: string; text?: string; required?: boolean; options?: unknown }> };
  templateSlug: string;
};

export type ValidateScenarioStructureUseCaseResponse = {
  valid: boolean;
  warnings: string[];
};
