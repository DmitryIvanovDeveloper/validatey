import { injectable, inject } from 'inversify';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { GenerateScenarioUseCase } from '../../application/use-cases/generate-scenario.use-case';
import { SaveScenarioVersionUseCase } from '../../application/use-cases/save-scenario-version.use-case';
import { GetScenarioUseCase } from '../../application/use-cases/get-scenario.use-case';
import { GenerateScenarioUseCaseRequest } from '../../application/use-cases/input-output/generate-scenario.io';
import { SaveScenarioVersionUseCaseRequest } from '../../application/use-cases/input-output/save-scenario-version.io';
import { GetScenarioUseCaseRequest } from '../../application/use-cases/input-output/get-scenario.io';

@injectable()
export class ScenarioPresenter {
  constructor(
    @inject(TYPES.GenerateScenarioUseCase)
    private readonly _generateScenarioUseCase: GenerateScenarioUseCase,
    @inject(TYPES.SaveScenarioVersionUseCase)
    private readonly _saveScenarioVersionUseCase: SaveScenarioVersionUseCase,
    @inject(TYPES.GetScenarioUseCase)
    private readonly _getScenarioUseCase: GetScenarioUseCase
  ) {}

  async generateScenario(request: GenerateScenarioUseCaseRequest) {
    return await this._generateScenarioUseCase.execute(request);
  }

  async saveScenarioVersion(request: SaveScenarioVersionUseCaseRequest) {
    return await this._saveScenarioVersionUseCase.execute(request);
  }

  async getScenario(request: GetScenarioUseCaseRequest) {
    return await this._getScenarioUseCase.execute(request);
  }
}

