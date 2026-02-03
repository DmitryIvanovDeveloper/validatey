import { injectable, inject } from 'inversify';
import Result from '../../../../infrastructure/result/result';
import type { ScenarioRepositoryPort } from '../ports/scenario-repository.port';
import { ScenarioGenerationError } from '../../domain/errors/scenario.error';
import { GenerateScenarioUseCaseRequest, GenerateScenarioUseCaseResponse } from './input-output/generate-scenario.io';
import type { EventBusPort } from '../../../../infrastructure/event-bus/ports/event-bus.port';
import { ScenarioGeneratedEvent } from '../events/scenario-generated-event';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { TYPES } from '../../infrastructure/bootstrap/types';

@injectable()
export class GenerateScenarioUseCase {
  constructor(
    @inject(TYPES.ScenarioRepository)
    private readonly _repository: ScenarioRepositoryPort,
    @inject(ROOT_TYPES.EventBus)
    private readonly _eventBus: EventBusPort
  ) {}

  async execute(input: GenerateScenarioUseCaseRequest): Promise<Result<GenerateScenarioUseCaseResponse, ScenarioGenerationError>> {
    const result = await this._repository.generateScenario(
      input.projectId,
      input.segment || null,
      input.hypothesis || null,
      input.marketContext ?? null,
      input.prompt
    );

    if (!result.isSuccess) {
      return Result.failure(result.error);
    }

    const scenario = result.data;

    // Публикация события
    this._eventBus.publish(new ScenarioGeneratedEvent(scenario.id, scenario.projectId));

    const createdAt =
      scenario.createdAt != null && typeof scenario.createdAt.toISOString === 'function'
        ? scenario.createdAt.toISOString()
        : new Date().toISOString();
    return Result.success({
      scenario: {
        id: scenario.id,
        projectId: scenario.projectId,
        content: scenario.content,
        version: scenario.version,
        status: scenario.status,
        createdAt
      }
    });
  }
}

