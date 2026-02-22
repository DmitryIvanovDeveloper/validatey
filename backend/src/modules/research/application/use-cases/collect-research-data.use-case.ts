import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { TYPES as PROJECT_TYPES } from '../../../projects/infrastructure/bootstrap/types';
import { TYPES as RESEARCH_TYPES } from '../../infrastructure/bootstrap/types';
import type { ProjectRepositoryPort } from '../../../projects/application/ports/project-repository.port';
import type { ResearchDataRepositoryPort } from '../ports/research-data-repository.port';
import type { MarketDataProviderPort } from '../ports/market-data-provider.port';
import type { CompetitorDataProviderPort } from '../ports/competitor-data-provider.port';
import type { AutocompleteDataProviderPort } from '../ports/autocomplete-data-provider.port';
import { ResearchNotFoundError, ResearchCooldownError } from '../../domain/errors/research.error';
import type { StoredResearchData } from '../../domain/value-objects/stored-research-data.vo';
import { CheckResearchAvailabilityUseCase } from './check-research-availability.use-case';
import type {
  CollectResearchDataRequest,
  CollectResearchDataResponse,
  ResearchIntent,
} from './input-output/collect-research-data.io';

@injectable()
export class CollectResearchDataUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(PROJECT_TYPES.ProjectRepository)
    private readonly _projectRepository: ProjectRepositoryPort,
    @inject(RESEARCH_TYPES.ResearchDataRepository)
    private readonly _researchDataRepository: ResearchDataRepositoryPort,
    @inject(RESEARCH_TYPES.CheckResearchAvailabilityUseCase)
    private readonly _checkAvailabilityUseCase: CheckResearchAvailabilityUseCase,
    @inject(RESEARCH_TYPES.MarketDataProvider)
    private readonly _marketDataProvider: MarketDataProviderPort,
    @inject(RESEARCH_TYPES.CompetitorDataProvider)
    private readonly _competitorDataProvider: CompetitorDataProviderPort,
    @inject(RESEARCH_TYPES.AutocompleteDataProvider)
    private readonly _autocompleteDataProvider: AutocompleteDataProviderPort
  ) {}

  async execute(
    request: CollectResearchDataRequest
  ): Promise<ResultEx<CollectResearchDataResponse, ResearchNotFoundError | ResearchCooldownError | Error>> {
    const { projectId }: CollectResearchDataRequest = request;
    this._logger.info('collect-research-data.start', { projectId });

    try {
      // NEW: Проверка доступности запуска
      const availabilityResult = await this._checkAvailabilityUseCase.execute({ projectId });
      if (!availabilityResult.isSuccess) {
        return ResultEx.failure(availabilityResult.error);
      }

      if (!availabilityResult.data.available) {
        // Возвращаем domain error вместо generic Error
        const nextAvailable: Date = availabilityResult.data.nextAvailableAt!;
        const timeUntilNext: number = availabilityResult.data.timeUntilNext;
        return ResultEx.failure(new ResearchCooldownError(nextAvailable, timeUntilNext));
      }

      const projectResult = await this._projectRepository.findById(projectId);
      if (!projectResult.isSuccess) {
        return ResultEx.failure(new ResearchNotFoundError(projectId));
      }
      const project = projectResult.data;

      const intent: ResearchIntent = this.buildResearchIntent(project, request);

      const autocompletePromise = request.skipAutocomplete
        ? Promise.resolve(ResultEx.success(null))
        : this._autocompleteDataProvider.fetchAutocompleteData(projectId, intent);

      const [marketResult, competitorResult, autocompleteResult] = await Promise.all([
        this._marketDataProvider.fetchMarketData(projectId, intent),
        this._competitorDataProvider.fetchCompetitorData(projectId, intent),
        autocompletePromise,
      ]);

      const marketData = marketResult.isSuccess ? marketResult.data : null;
      const competitorData = competitorResult.isSuccess ? competitorResult.data : null;
      const autocompleteInsights = autocompleteResult.isSuccess ? autocompleteResult.data : null;

      const existingResult = await this._researchDataRepository.findByProjectId(projectId);
      const existing = existingResult.isSuccess ? existingResult.data : null;

      const now: Date = new Date();
      const updated: StoredResearchData = {
        projectId,
        marketData: marketData ?? existing?.marketData ?? null,
        competitorData: competitorData ?? existing?.competitorData ?? null,
        userInsights: existing?.userInsights ?? null,
        autocompleteInsights: autocompleteInsights ?? existing?.autocompleteInsights ?? null,
        synthesisReport: existing?.synthesisReport ?? null,
        assumptionAssessments: existing?.assumptionAssessments ?? null,
        commentPatternAnalysis: existing?.commentPatternAnalysis ?? null,
        lastResearchRunAt: now,
        updatedAt: now,
      };
      const saveResult = await this._researchDataRepository.save(updated);
      if (!saveResult.isSuccess) {
        return ResultEx.failure(saveResult.error);
      }

      return ResultEx.success({
        collected: true,
        marketDataCollected: marketData != null,
        competitorDataCollected: competitorData != null,
        autocompleteDataCollected: autocompleteInsights != null,
      });
    } catch (error) {
      this._logger.error('collect-research-data.exception', { projectId, error });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  private buildResearchIntent(
    project: { name: string; hypothesis?: { description?: string } | null; segment?: { description?: string } | null },
    request: CollectResearchDataRequest
  ): ResearchIntent {
    const topic = [project.name, project.hypothesis?.description].filter(Boolean).join('. ').trim() || '';
    const segment =
      request.segment ??
      (typeof project.segment?.description === 'string' ? project.segment.description : undefined);
    return {
      topic,
      geography: request.geography,
      segment,
      productDescription: request.productDescription ?? project.hypothesis?.description,
    };
  }
}
