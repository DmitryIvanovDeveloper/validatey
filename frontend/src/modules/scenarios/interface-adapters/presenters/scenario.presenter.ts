import { injectable, inject } from 'inversify';
import type { GenerateScenarioUseCase } from '../../application/use-cases/generate-scenario.use-case';
import { ScenarioViewModel } from '../view-models/scenario.view-model';
import { Scenario, ScenarioStatus } from '../../domain/entities/scenario.entity';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';

@injectable()
export class ScenarioPresenter {
  constructor(
    @inject(TYPES.GenerateScenarioUseCase)
    private readonly _generateScenarioUseCase: GenerateScenarioUseCase,
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}

  async generateScenario(
    projectId: string,
    viewModel: ScenarioViewModel,
    segment?: { description: string; demographics: Record<string, any> } | null,
    hypothesis?: { description: string; assumptions: string[] } | null,
    marketContext?: { marketPicture?: string; marketFit?: string; differentiation?: string } | null,
    prompt?: string
  ): Promise<void> {
    viewModel.loading.value = true;
    viewModel.error.value = null;

    const result = await this._generateScenarioUseCase.execute({
      projectId,
      segment,
      hypothesis,
      marketContext: marketContext ?? null,
      prompt,
    });

    if (result.isSuccess) {
      const scenarioData = result.data.scenario;
      const createdAt =
        scenarioData.createdAt != null
          ? new Date(scenarioData.createdAt)
          : new Date();
      const content = (scenarioData.content ?? '').trim() || '(No content)';
      const scenario = new Scenario(
        scenarioData.id,
        scenarioData.projectId,
        content,
        scenarioData.version ?? 1,
        (scenarioData.status as ScenarioStatus) ?? 'generated',
        isNaN(createdAt.getTime()) ? new Date() : createdAt
      );

      viewModel.scenario.value = scenario;
      viewModel.loading.value = false;
      this._logger.info('Scenario generated', { projectId, scenarioId: scenarioData.id });
    } else {
      viewModel.error.value = result.error.message;
      viewModel.loading.value = false;
      this._logger.error('Failed to generate scenario', { projectId, error: result.error });
    }
  }
}

