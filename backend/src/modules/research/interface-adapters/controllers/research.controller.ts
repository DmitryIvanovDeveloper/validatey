import { injectable, inject } from 'inversify';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { COMMENT_TYPES } from '../../../comments/types';
import { ResearchCooldownError, ResearchNotFoundError } from '../../domain/errors/research.error';
import { GetResearchCanvasUseCase } from '../../application/use-cases/get-research-canvas.use-case';
import { GenerateSynthesisUseCase } from '../../application/use-cases/generate-synthesis.use-case';
import { GenerateUserStoriesUseCase } from '../../application/use-cases/generate-user-stories.use-case';
import { CheckResearchAvailabilityUseCase } from '../../application/use-cases/check-research-availability.use-case';
import type { GetResearchCanvasRequest, GetResearchCanvasResponse } from '../../application/use-cases/input-output/get-research-canvas.io';
import type { GenerateSynthesisRequest, GenerateSynthesisResponse } from '../../application/use-cases/input-output/generate-synthesis.io';
import type { GenerateUserStoriesRequest, GenerateUserStoriesResponse } from '../../application/use-cases/input-output/generate-user-stories.io';
import type { CheckResearchAvailabilityRequest, CheckResearchAvailabilityResponse } from '../../application/use-cases/input-output/check-research-availability.io';
import type { CollectResearchDataRequest, CollectResearchDataResponse } from '../../application/use-cases/input-output/collect-research-data.io';
import { CollectResearchDataUseCase } from '../../application/use-cases/collect-research-data.use-case';
import type { ResearchAssistantRequest, ResearchAssistantResponse } from '../../application/use-cases/input-output/research-assistant.io';
import { ResearchAssistantUseCase } from '../../application/use-cases/research-assistant.use-case';
import type { ResearchDataRepositoryPort } from '../../application/ports/research-data-repository.port';
import type { StoredResearchData } from '../../domain/value-objects/stored-research-data.vo';
import type { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';

@injectable()
export class ResearchController {
	constructor(
		@inject(TYPES.GetResearchCanvasUseCase)
		private readonly _getResearchCanvasUseCase: GetResearchCanvasUseCase,
		@inject(TYPES.GenerateSynthesisUseCase)
		private readonly _generateSynthesisUseCase: GenerateSynthesisUseCase,
		@inject(TYPES.GenerateUserStoriesUseCase)
		private readonly _generateUserStoriesUseCase: GenerateUserStoriesUseCase,
		@inject(TYPES.CheckResearchAvailabilityUseCase)
		private readonly _checkResearchAvailabilityUseCase: CheckResearchAvailabilityUseCase,
		@inject(TYPES.CollectResearchDataUseCase)
		private readonly _collectResearchDataUseCase: CollectResearchDataUseCase,
		@inject(TYPES.ResearchAssistantUseCase)
		private readonly _researchAssistantUseCase: ResearchAssistantUseCase,
		@inject(TYPES.ResearchDataRepository)
		private readonly _researchDataRepository: ResearchDataRepositoryPort,
		@inject(ROOT_TYPES.Logger)
		private readonly _logger: LoggerPort
	) {}

	public async getCanvas(request: GetResearchCanvasRequest): Promise<ResultEx<GetResearchCanvasResponse, Error>> {
		return this._getResearchCanvasUseCase.execute(request);
	}

	public async generateSynthesis(request: GenerateSynthesisRequest): Promise<ResultEx<GenerateSynthesisResponse, Error>> {
		// Execute synthesis (now includes comment pattern analysis)
		const synthesisResult = await this._generateSynthesisUseCase.execute(request);
		if (!synthesisResult.isSuccess) {
			return synthesisResult;
		}

		// Comment pattern analysis is now included in synthesis, no separate call needed
		this._logger.info('research-controller.synthesis-completed', {
			projectId: request.projectId,
			hasCommentPatternAnalysis: !!synthesisResult.data.report?.commentPatternAnalysis
		});

		return synthesisResult;
	}

	public async checkAvailability(request: CheckResearchAvailabilityRequest): Promise<ResultEx<CheckResearchAvailabilityResponse, ResearchNotFoundError | Error>> {
		return this._checkResearchAvailabilityUseCase.execute(request);
	}

	public async collectData(request: CollectResearchDataRequest): Promise<ResultEx<CollectResearchDataResponse, ResearchNotFoundError | ResearchCooldownError | Error>> {
		return this._collectResearchDataUseCase.execute(request);
	}

	public async sendAssistantMessage(request: ResearchAssistantRequest): Promise<ResultEx<ResearchAssistantResponse, Error>> {
		return this._researchAssistantUseCase.execute(request);
	}

	public async generateUserStories(request: GenerateUserStoriesRequest): Promise<ResultEx<GenerateUserStoriesResponse, Error>> {
		this._logger.info('research-controller.generate-user-stories', { projectId: request.projectId });
		return this._generateUserStoriesUseCase.execute(request);
	}
}
