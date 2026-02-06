import Result from '../../../../infrastructure/result/result';
import { Scenario } from '../../domain/entities/scenario.entity';
import { ScenarioNotFoundError, ScenarioGenerationError } from '../../domain/errors/scenario.error';

export type MarketContextForScenario = {
  marketPicture?: string;
  marketFit?: string;
  differentiation?: string;
} | null;

export interface ScenarioRepositoryPort {
  generateScenario(
    projectId: string,
    segment?: { description: string; demographics: Record<string, unknown> } | null,
    hypothesis?: { description: string; assumptions: string[] } | null,
    marketContext?: MarketContextForScenario,
    prompt?: string
  ): Promise<Result<Scenario, ScenarioGenerationError>>;
  getById(projectId: string, scenarioId: string): Promise<Result<Scenario, ScenarioNotFoundError>>;
  getLatestByProjectId(projectId: string): Promise<Result<Scenario, ScenarioNotFoundError>>;
  update(projectId: string, scenarioId: string, content: string): Promise<Result<Scenario, ScenarioNotFoundError>>;
  /** Save a new scenario version (POST) - used when completing wizard with edited or template content */
  saveVersion(projectId: string, content: string): Promise<Result<Scenario, ScenarioNotFoundError>>;
  /** List scenario templates (WTP, Feature Demand, Value Prop) */
  getTemplates(): Promise<Result<Array<{ slug: string; name: string; content: string }>, ScenarioNotFoundError>>;
  /** Save scenario quality rating (1-5) after AI generation */
  rateScenario(projectId: string, scenarioId: string, rating: number): Promise<Result<{ id: string }, ScenarioNotFoundError>>;
  /** Validate scenario structure for template (POST /scenarios/validate). Returns { valid, warnings }. */
  validateScenarioStructure(scenarioContent: string, templateSlug: string): Promise<{ valid: boolean; warnings: string[] }>;
}

