export type SaveScenarioRatingUseCaseInput = {
  projectId: string;
  scenarioId: string;
  rating: number;
  userId?: string;
};

export type SaveScenarioRatingUseCaseOutput = {
  id: string;
};
