import { Scenario } from '../../../domain/entities/scenario.entity';

export type GetScenarioUseCaseRequest = {
  projectId: string;
  scenarioId?: string;
  version?: number;
};

export type GetScenarioUseCaseResponse = {
  scenario: Scenario;
};

