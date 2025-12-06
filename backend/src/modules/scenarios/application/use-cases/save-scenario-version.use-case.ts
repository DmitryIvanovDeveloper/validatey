import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { ScenarioEntity } from '../../domain/entities/scenario.entity';
import { InvalidScenarioDataError } from '../../domain/errors/scenario.error';
import { ScenarioRepositoryPort } from '../ports/scenario-repository.port';
import { SaveScenarioVersionUseCaseRequest, SaveScenarioVersionUseCaseResponse } from './input-output/save-scenario-version.io';
import { TYPES } from '../../infrastructure/bootstrap/types';

@injectable()
export class SaveScenarioVersionUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(TYPES.ScenarioRepository)
    private readonly _repository: ScenarioRepositoryPort
  ) {}

  async execute(
    request: SaveScenarioVersionUseCaseRequest
  ): Promise<ResultEx<SaveScenarioVersionUseCaseResponse, InvalidScenarioDataError>> {
    this._logger.info('save-scenario-version.start', { projectId: request.projectId });

    try {
      // Get latest version to increment
      const versionResult = await this._repository.getLatestVersion(request.projectId);
      const nextVersion = versionResult.isSuccess ? versionResult.data + 1 : 1;

      // Create scenario entity (edited version)
      const scenario = ScenarioEntity.create(
        request.projectId,
        request.content,
        false, // isGenerated = false for manual edits
        request.metadata || undefined
      ).withVersion(nextVersion).withEdited(true);

      // Save to repository
      const saveResult = await this._repository.create(scenario.toData());

      if (!saveResult.isSuccess) {
        this._logger.error('save-scenario-version.save-error', { error: saveResult.error });
        return ResultEx.failure(saveResult.error);
      }

      this._logger.info('save-scenario-version.success', { scenarioId: saveResult.data.id, version: nextVersion });

      return ResultEx.success({
        scenario: saveResult.data,
      });
    } catch (error) {
      this._logger.error('save-scenario-version.error', { error });
      if (error instanceof InvalidScenarioDataError) {
        return ResultEx.failure(error);
      }
      return ResultEx.failure(new InvalidScenarioDataError(error instanceof Error ? error.message : 'Unknown error'));
    }
  }
}

