import ResultEx from '../../../../infrastructure/result/result';
import { Scenario } from '../../domain/entities/scenario.entity';
import { ScenarioNotFoundError, InvalidScenarioDataError } from '../../domain/errors/scenario.error';

export interface ScenarioRepositoryPort {
  create(scenario: Scenario): Promise<ResultEx<Scenario, InvalidScenarioDataError>>;
  findById(id: string): Promise<ResultEx<Scenario, ScenarioNotFoundError>>;
  findByProjectId(projectId: string): Promise<ResultEx<Scenario[], Error>>;
  findByProjectIdAndVersion(projectId: string, version: number): Promise<ResultEx<Scenario, ScenarioNotFoundError>>;
  update(scenario: Scenario): Promise<ResultEx<Scenario, ScenarioNotFoundError | InvalidScenarioDataError>>;
  getLatestVersion(projectId: string): Promise<ResultEx<number, Error>>;
}



