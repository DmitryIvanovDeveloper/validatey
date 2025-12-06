export abstract class ScenarioError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ScenarioError';
  }
}

export class ScenarioNotFoundError extends ScenarioError {
  constructor(scenarioId: string) {
    super(`Scenario with id ${scenarioId} not found`);
    this.name = 'ScenarioNotFoundError';
  }
}

export class ScenarioGenerationError extends ScenarioError {
  constructor(message: string) {
    super(`Scenario generation failed: ${message}`);
    this.name = 'ScenarioGenerationError';
  }
}

