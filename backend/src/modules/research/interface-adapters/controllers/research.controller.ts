import { injectable, inject } from 'inversify';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { GetResearchCanvasUseCase } from '../../application/use-cases/get-research-canvas.use-case';
import { GenerateSynthesisUseCase } from '../../application/use-cases/generate-synthesis.use-case';
import type { GetResearchCanvasRequest, GetResearchCanvasResponse } from '../../application/use-cases/input-output/get-research-canvas.io';
import type { GenerateSynthesisRequest, GenerateSynthesisResponse } from '../../application/use-cases/input-output/generate-synthesis.io';
import type { CollectResearchDataRequest, CollectResearchDataResponse } from '../../application/use-cases/input-output/collect-research-data.io';
import { CollectResearchDataUseCase } from '../../application/use-cases/collect-research-data.use-case';
import type { ResearchAssistantRequest, ResearchAssistantResponse } from '../../application/use-cases/input-output/research-assistant.io';
import { ResearchAssistantUseCase } from '../../application/use-cases/research-assistant.use-case';
import ResultEx from '../../../../infrastructure/result/result';

@injectable()
export class ResearchController {
	constructor(
		@inject(TYPES.GetResearchCanvasUseCase)
		private readonly _getResearchCanvasUseCase: GetResearchCanvasUseCase,
		@inject(TYPES.GenerateSynthesisUseCase)
		private readonly _generateSynthesisUseCase: GenerateSynthesisUseCase,
		@inject(TYPES.CollectResearchDataUseCase)
		private readonly _collectResearchDataUseCase: CollectResearchDataUseCase,
		@inject(TYPES.ResearchAssistantUseCase)
		private readonly _researchAssistantUseCase: ResearchAssistantUseCase
	) {}

	public async getCanvas(request: GetResearchCanvasRequest): Promise<ResultEx<GetResearchCanvasResponse, Error>> {
		return this._getResearchCanvasUseCase.execute(request);
	}

	public async generateSynthesis(request: GenerateSynthesisRequest): Promise<ResultEx<GenerateSynthesisResponse, Error>> {
		return this._generateSynthesisUseCase.execute(request);
	}

	public async collectData(request: CollectResearchDataRequest): Promise<ResultEx<CollectResearchDataResponse, Error>> {
		return this._collectResearchDataUseCase.execute(request);
	}

	public async sendAssistantMessage(request: ResearchAssistantRequest): Promise<ResultEx<ResearchAssistantResponse, Error>> {
		return this._researchAssistantUseCase.execute(request);
	}
}
