import { injectable, inject } from 'inversify';
import { GetResearchCanvasUseCase } from '../../application/use-cases/get-research-canvas.use-case';
import { CollectResearchDataUseCase } from '../../application/use-cases/collect-research-data.use-case';
import { GenerateSynthesisUseCase } from '../../application/use-cases/generate-synthesis.use-case';
import { ResearchAssistantUseCase } from '../../application/use-cases/research-assistant.use-case';
import { CheckResearchAvailabilityUseCase } from '../../application/use-cases/check-research-availability.use-case';
import type { ResearchCanvas, SynthesisReport } from '../../domain/entities/research-canvas.entity';
import type { ResearchIntent } from '../../domain/value-objects/research-intent.vo';
import type {
  GetResearchCanvasResponse,
  CollectResearchDataResponse,
  GenerateSynthesisResponse,
  AskAssistantResponse,
  CheckResearchAvailabilityResponse
} from '../../domain/types/research.types';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import { ResearchRepositoryPort } from '../../application/ports/research-repository.port';
import { ResearchCooldownError } from '../../domain/errors/research.error';

@injectable()
export class ResearchPresenter {
  // View model for reactive UI updates
  viewModel = {
    commentsFetching: false,
    commentsOnlyLoading: false,
    researchLoading: false,
  };

  constructor(
    @inject(TYPES.GetResearchCanvasUseCase)
    private readonly _getResearchCanvasUseCase: GetResearchCanvasUseCase,
    @inject(TYPES.CollectResearchDataUseCase)
    private readonly _collectResearchDataUseCase: CollectResearchDataUseCase,
    @inject(TYPES.GenerateSynthesisUseCase)
    private readonly _generateSynthesisUseCase: GenerateSynthesisUseCase,
    @inject(TYPES.ResearchAssistantUseCase)
    private readonly _researchAssistantUseCase: ResearchAssistantUseCase,
    @inject(TYPES.CheckResearchAvailabilityUseCase)
    private readonly _checkResearchAvailabilityUseCase: CheckResearchAvailabilityUseCase,
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}

  async getResearchCanvas(projectId: string): Promise<GetResearchCanvasResponse> {
    try {
      const result = await this._getResearchCanvasUseCase.execute({ projectId });
      return result;
    } catch (error) {
      this._logger.error('Failed to get research canvas', { projectId, error });
      return {
        canvas: this.createEmptyCanvas(projectId),
        error: error instanceof Error ? error.message : 'Failed to load research data',
      };
    }
  }

  async checkResearchAvailability(projectId: string): Promise<CheckResearchAvailabilityResponse> {
    try {
      const result = await this._checkResearchAvailabilityUseCase.execute({ projectId });
      return result;
    } catch (error) {
      this._logger.error('Failed to check research availability', { projectId, error });
      return {
        available: true, // fallback - consider available
        nextAvailableAt: null,
        timeUntilNext: 0,
      };
    }
  }

  async collectResearchData(projectId: string, intent: ResearchIntent): Promise<CollectResearchDataResponse> {
    try {
      const result = await this._collectResearchDataUseCase.execute({ projectId, intent });
      return result;
    } catch (error) {
      this._logger.error('Failed to collect research data', { projectId, error });

      // Handle ResearchCooldownError specially - return the structured error object
      if (error instanceof ResearchCooldownError) {
        return {
          canvas: this.createEmptyCanvas(projectId),
          error: error.toDetails(), // Return structured error object, not just message
        };
      }

      return {
        canvas: this.createEmptyCanvas(projectId),
        error: error instanceof Error ? error.message : 'Failed to collect research data',
      };
    }
  }

  async generateSynthesis(projectId: string): Promise<GenerateSynthesisResponse> {
    try {
      const result = await this._generateSynthesisUseCase.execute({ projectId });
      return result;
    } catch (error) {
      this._logger.error('Failed to generate synthesis', { projectId, error });
      return {
        report: { summary: '', recommendations: [] },
        error: error instanceof Error ? error.message : 'Failed to generate synthesis',
      };
    }
  }

  async askAssistant(projectId: string, question: string): Promise<AskAssistantResponse> {
    try {
      const result = await this._researchAssistantUseCase.execute({ projectId, question });
      return result;
    } catch (error) {
      this._logger.error('Failed to get assistant response', { projectId, question, error });
      return {
        reply: 'I apologize, but I\'m unable to provide assistance at the moment.',
        error: error instanceof Error ? error.message : 'Failed to get assistant response',
      };
    }
  }

  async setCommentsFetchStatus(projectId: string, isFetching: boolean): Promise<void> {
    this.viewModel.commentsFetching = isFetching;
  }

  async setCommentsOnlyLoading(projectId: string, isLoading: boolean): Promise<void> {
    this.viewModel.commentsOnlyLoading = isLoading;
  }

  async setResearchLoading(projectId: string, isLoading: boolean): Promise<void> {
    this.viewModel.researchLoading = isLoading;
  }

  private createEmptyCanvas(projectId: string): ResearchCanvas {
    return {
      projectId,
      marketData: {},
      competitorInfo: {},
      userInsights: {},
      autocompleteInsights: null,
      earlySignals: null,
    };
  }
}