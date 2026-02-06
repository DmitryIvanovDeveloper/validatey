import { injectable, inject } from 'inversify';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { GenerateScenarioUseCase } from '../../application/use-cases/generate-scenario.use-case';
import { SaveScenarioVersionUseCase } from '../../application/use-cases/save-scenario-version.use-case';
import { SaveScenarioRatingUseCase } from '../../application/use-cases/save-scenario-rating.use-case';
import { GetScenarioUseCase } from '../../application/use-cases/get-scenario.use-case';
import { GetScenarioTemplatesUseCase } from '../../application/use-cases/get-scenario-templates.use-case';
import { ValidateScenarioStructureUseCase } from '../../application/use-cases/validate-scenario-structure.use-case';
import { GenerateScenarioUseCaseRequest } from '../../application/use-cases/input-output/generate-scenario.io';
import { SaveScenarioVersionUseCaseRequest } from '../../application/use-cases/input-output/save-scenario-version.io';
import { SaveScenarioRatingUseCaseInput } from '../../application/use-cases/input-output/save-scenario-rating.io';
import { GetScenarioUseCaseRequest } from '../../application/use-cases/input-output/get-scenario.io';
import { ValidateScenarioStructureUseCaseRequest } from '../../application/use-cases/input-output/validate-scenario-structure.io';

@injectable()
export class ScenarioController {
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
		private readonly _getScenarioTemplatesUseCase: GetScenarioTemplatesUseCase,
		@inject(TYPES.ValidateScenarioStructureUseCase)
		private readonly _validateScenarioStructureUseCase: ValidateScenarioStructureUseCase
	) {}

	public async generateScenario(request: GenerateScenarioUseCaseRequest): Promise<ReturnType<GenerateScenarioUseCase['execute']>> {
		return this._generateScenarioUseCase.execute(request);
	}

	public async saveScenarioVersion(request: SaveScenarioVersionUseCaseRequest): Promise<ReturnType<SaveScenarioVersionUseCase['execute']>> {
		return this._saveScenarioVersionUseCase.execute(request);
	}

	public async getScenario(request: GetScenarioUseCaseRequest): Promise<ReturnType<GetScenarioUseCase['execute']>> {
		return this._getScenarioUseCase.execute(request);
	}

	public async getTemplates(): Promise<ReturnType<GetScenarioTemplatesUseCase['execute']>> {
		return this._getScenarioTemplatesUseCase.execute();
	}

	public async rateScenario(input: SaveScenarioRatingUseCaseInput): Promise<ReturnType<SaveScenarioRatingUseCase['execute']>> {
		return this._saveScenarioRatingUseCase.execute(input);
	}

	public validateScenarioStructure(request: ValidateScenarioStructureUseCaseRequest): ReturnType<ValidateScenarioStructureUseCase['execute']> {
		return this._validateScenarioStructureUseCase.execute(request);
	}
}
