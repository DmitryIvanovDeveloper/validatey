import Result from '../../../../infrastructure/result/result';
import { Scenario } from '../../domain/entities/scenario.entity';
import { ScenarioNotFoundError, ScenarioGenerationError } from '../../domain/errors/scenario.error';

export interface ScenarioRepositoryPort {
  generateScenario(
    projectId: string,
    segment?: { description: string; demographics: Record<string, any> } | null,
    hypothesis?: { description: string; assumptions: string[] } | null,
    prompt?: string
  ): Promise<Result<Scenario, ScenarioGenerationError>>;
  getById(projectId: string, scenarioId: string): Promise<Result<Scenario, ScenarioNotFoundError>>;
  update(projectId: string, scenarioId: string, content: string): Promise<Result<Scenario, ScenarioNotFoundError>>;
}

