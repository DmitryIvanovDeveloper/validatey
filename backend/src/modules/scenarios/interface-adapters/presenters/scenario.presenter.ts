import { injectable, inject } from 'inversify';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { GenerateScenarioUseCase } from '../../application/use-cases/generate-scenario.use-case';
import { SaveScenarioVersionUseCase } from '../../application/use-cases/save-scenario-version.use-case';
import { SaveScenarioRatingUseCase } from '../../application/use-cases/save-scenario-rating.use-case';
import { GetScenarioUseCase } from '../../application/use-cases/get-scenario.use-case';
import { GetScenarioTemplatesUseCase } from '../../application/use-cases/get-scenario-templates.use-case';
import { GenerateScenarioUseCaseRequest } from '../../application/use-cases/input-output/generate-scenario.io';
import { SaveScenarioVersionUseCaseRequest } from '../../application/use-cases/input-output/save-scenario-version.io';
import { SaveScenarioRatingUseCaseInput } from '../../application/use-cases/input-output/save-scenario-rating.io';
import { GetScenarioUseCaseRequest } from '../../application/use-cases/input-output/get-scenario.io';

@injectable()
export class ScenarioPresenter {
  constructor(
    @inject(TYPES.GenerateScenarioUseCase)
    private readonly _generateScenarioUseCase: GenerateScenarioUseCase,
    @inject(TYPES.SaveScenarioVersionUseCase)
    private readonly _saveScenarioVersionUseCase: SaveScenarioVersionUseCase,
    @inject(TYPES.SaveScenarioRatingUseCase)
    private readonly _saveScenarioRatingUseCase: SaveScenarioRatingUseCase,
    @inject(TYPES.GetScenarioUseCase)
    private readonly _getScenarioUseCase: GetScenarioUseCase,
    @inject(TYPES.GetScenarioTemplatesUseCase)
    private readonly _getScenarioTemplatesUseCase: GetScenarioTemplatesUseCase
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

  async getTemplates() {
    return await this._getScenarioTemplatesUseCase.execute();
  }

  async rateScenario(input: SaveScenarioRatingUseCaseInput) {
    return await this._saveScenarioRatingUseCase.execute(input);
  }
}



