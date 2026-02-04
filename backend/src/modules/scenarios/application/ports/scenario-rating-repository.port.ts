export interface ScenarioRatingRepositoryPort {
  save(params: {
    projectId: string;
    scenarioId: string;
    rating: number;
    userId?: string;
  }): Promise<{ id: string } | { error: string }>;
}
