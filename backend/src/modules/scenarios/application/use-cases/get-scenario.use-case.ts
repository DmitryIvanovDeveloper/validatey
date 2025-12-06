import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { ScenarioNotFoundError } from '../../domain/errors/scenario.error';
import { ScenarioRepositoryPort } from '../ports/scenario-repository.port';
import { GetScenarioUseCaseRequest, GetScenarioUseCaseResponse } from './input-output/get-scenario.io';
import { TYPES } from '../../infrastructure/bootstrap/types';

@injectable()
export class GetScenarioUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(TYPES.ScenarioRepository)
    private readonly _repository: ScenarioRepositoryPort
  ) {}

  async execute(request: GetScenarioUseCaseRequest): Promise<ResultEx<GetScenarioUseCaseResponse, ScenarioNotFoundError>> {
    this._logger.info('get-scenario.start', { projectId: request.projectId, version: request.version });

    let result;

    if (request.version) {
      result = await this._repository.findByProjectIdAndVersion(request.projectId, request.version);
    } else {
      // Get latest version
      const versionResult = await this._repository.getLatestVersion(request.projectId);
      if (!versionResult.isSuccess) {
        this._logger.error('get-scenario.version-error', { error: versionResult.error });
        return ResultEx.failure(new ScenarioNotFoundError(`scenario for project ${request.projectId}`));
      }
      result = await this._repository.findByProjectIdAndVersion(request.projectId, versionResult.data);
    }

    if (!result.isSuccess) {
      this._logger.error('get-scenario.not-found', { projectId: request.projectId, version: request.version });
      return ResultEx.failure(result.error);
    }

    this._logger.info('get-scenario.success', { scenarioId: result.data.id });

    return ResultEx.success({
      scenario: result.data,
    });
  }
}

