import { injectable, inject } from 'inversify';
import { reactive } from 'vue';
import { GetResearchCanvasUseCase } from '../../application/use-cases/get-research-canvas.use-case';
import { CollectResearchDataUseCase } from '../../application/use-cases/collect-research-data.use-case';
import { GenerateSynthesisUseCase } from '../../application/use-cases/generate-synthesis.use-case';
import { ResearchAssistantUseCase } from '../../application/use-cases/research-assistant.use-case';
import { CheckResearchAvailabilityUseCase } from '../../application/use-cases/check-research-availability.use-case';
import { GenerateUserStoriesUseCase } from '../../application/use-cases/generate-user-stories.use-case';
import type { ResearchCanvas, SynthesisReport } from '../../domain/entities/research-canvas.entity';
import type { ResearchIntent } from '../../domain/value-objects/research-intent.vo';
import type {
  GetResearchCanvasResponse,
  CollectResearchDataResponse,
  GenerateSynthesisResponse,
  AskAssistantResponse,
  CheckResearchAvailabilityResponse,
} from '../../domain/types/research.types';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import { ResearchRepositoryPort } from '../../application/ports/research-repository.port';
import { ResearchCooldownError } from '../../domain/errors/research.error';

// Define UserStory type locally to avoid circular imports
export interface UserStory {
  id: string;
  role: string;
  goal: string;
  benefit: string;
  priority: 'high' | 'medium' | 'low';
  acceptanceCriteria: string[];
  functionalArea: string;
  /** Optional: how to address the need (from hypothesis/synthesis). */
  solutionDirection?: string;
}

type HypothesisStatus = 'confirmed' | 'need_more' | 'not_supported' | null;

@injectable()
export class ResearchPresenter {
  readonly labels = {
    title: 'Research Canvas',
    subtitle: 'AI-powered market and competitive research',
    breadcrumbProjects: 'Projects',
    breadcrumbProject: 'Project',
    breadcrumbResearch: 'Research',
    back: 'Back',
    startResearch: 'Start Research',
    researching: 'Researching...',
    researchingComments: 'Researching... (Comments loading...)',
    collectingComments: 'Collecting comments...',
    researchSettings: 'Research Settings',
    researchSettingsSubtitle: 'Configure research parameters (optional)',
    geographyPlaceholder: 'Geography (e.g. US, EU)',
    segmentPlaceholder: 'Segment (e.g. B2B SMB)',
    tabCompetitors: 'Competitors',
    tabSearch: 'Search Suggestions',
    tabSignals: 'User Signals',
    tabSynthesis: 'Synthesis',
    tabAssistant: 'AI Assistant',
  };

  // Кеш для статусов hypothesis
  private statusCache = new Map<string, HypothesisStatus>();

  // View model for reactive UI updates
  viewModel = reactive({
    commentsFetching: false,
    commentsOnlyLoading: false,
    researchLoading: false,
    userStories: [] as UserStory[],
    userStoriesGeneratedAt: null as Date | null,
    isGeneratingUserStories: false,
    userStoriesError: null as string | null,
    userStoriesErrorPreview: null as string | null,
  });

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
    @inject(TYPES.GenerateUserStoriesUseCase)
    private readonly _generateUserStoriesUseCase: GenerateUserStoriesUseCase,
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}

  async getResearchCanvas(projectId: string): Promise<GetResearchCanvasResponse> {
    try {
      const result = await this._getResearchCanvasUseCase.execute({ projectId });

      // Update user stories in view model if they exist
      if (result.userStories) {
        this.viewModel.userStories = result.userStories;
        this.viewModel.userStoriesGeneratedAt = result.userStoriesGeneratedAt;
      }

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

  async getHypothesisStatus(projectId: string): Promise<HypothesisStatus> {
    // Проверяем кеш
    if (this.statusCache.has(projectId)) {
      return this.statusCache.get(projectId)!;
    }

    try {
      const result = await this.getResearchCanvas(projectId);
      let status: HypothesisStatus = null;

      if (result.synthesisReport?.verdict) {
        const v = String(result.synthesisReport.verdict).toLowerCase();
        if (v === 'validated' || v === 'strong-validation' || v === 'strong_validation') {
          status = 'confirmed';
        } else if (v === 'rejected') {
          status = 'not_supported';
        } else if (v === 'needs-more-data' || v === 'needs_more_data') {
          status = 'need_more';
        }
      }

      // Сохраняем в кеш
      this.statusCache.set(projectId, status);
      return status;
    } catch (error) {
      this._logger.warn('Failed to get hypothesis status', { projectId, error });
      this.statusCache.set(projectId, null);
      return null;
    }
  }

  clearHypothesisStatusCache(projectId?: string): void {
    if (projectId) {
      this.statusCache.delete(projectId);
    } else {
      this.statusCache.clear();
    }
  }

  async generateUserStories(projectId: string): Promise<{ data?: UserStory[]; error?: string }> {
    try {
      this.viewModel.isGeneratingUserStories = true;
      this.viewModel.userStoriesError = null;

      const result = await this._generateUserStoriesUseCase.execute({ projectId });

      if (!result.isSuccess) {
        const error = result.error;
        this.viewModel.userStoriesError = error.message;
        this._logger.error('Failed to generate user stories', { projectId, error: error.message });
        return { error: error.message };
      }

      const data = result.data;
      this.viewModel.userStories = data.userStories;
      this.viewModel.userStoriesGeneratedAt = data.generatedAt;

      this._logger.info('Successfully generated user stories', {
        projectId,
        storiesCount: data.userStories.length
      });

      // Refresh research canvas to ensure all data is synchronized
      await this.getResearchCanvas(projectId);

      return { data: data.userStories };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.viewModel.userStoriesError = errorMessage;
      this.viewModel.userStoriesErrorPreview = null;
      this._logger.error('Exception generating user stories', { projectId, error });
      return { error: errorMessage };
    } finally {
      this.viewModel.isGeneratingUserStories = false;
    }
  }

  async regenerateUserStories(projectId: string): Promise<{ data?: UserStory[]; error?: string }> {
    // Clear existing data
    this.viewModel.userStories = [];
    this.viewModel.userStoriesGeneratedAt = null;

    return this.generateUserStories(projectId);
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