export class ScenarioError extends Error {
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

export class InvalidScenarioDataError extends ScenarioError {
  constructor(message: string) {
    super(`Invalid scenario data: ${message}`);
    this.name = 'InvalidScenarioDataError';
  }
}

export class ScenarioGenerationError extends ScenarioError {
  constructor(message: string) {
    super(`Failed to generate scenario: ${message}`);
    this.name = 'ScenarioGenerationError';
  }
}

