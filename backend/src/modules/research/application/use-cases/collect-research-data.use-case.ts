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
import type { AcademicPapersProviderPort } from '../ports/academic-papers-provider.port';
import type { HnSearchCommentsCollectorPort } from '../ports/hn-search-comments-collector.port';
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
    private readonly _autocompleteDataProvider: AutocompleteDataProviderPort,
    @inject(RESEARCH_TYPES.AcademicPapersProvider)
    private readonly _academicPapersProvider: AcademicPapersProviderPort,
    @inject(RESEARCH_TYPES.HnSearchCommentsCollector)
    private readonly _hnSearchCollector: HnSearchCommentsCollectorPort
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

      // Persist "in progress" so reload can show same state
      const statusSet = await this._researchDataRepository.updateResearchStatus(projectId, 'collecting');
      if (!statusSet.isSuccess) {
        this._logger.warn('collect-research-data.status-set-failed', { projectId, error: statusSet.error });
      }

      const intent: ResearchIntent = this.buildResearchIntent(project, request);

      const autocompletePromise = request.skipAutocomplete
        ? Promise.resolve(ResultEx.success(null))
        : this._autocompleteDataProvider.fetchAutocompleteData(projectId, intent);

      const hnSearchQuery = this.buildHnSearchQuery(intent);

      const [marketResult, competitorResult, autocompleteResult, academicPapersResult, hnSearchResult] =
        await Promise.all([
          this._marketDataProvider.fetchMarketData(projectId, intent),
          this._competitorDataProvider.fetchCompetitorData(projectId, intent),
          autocompletePromise,
          this._academicPapersProvider.fetchAcademicPapers(projectId, intent),
          hnSearchQuery
            ? this._hnSearchCollector.collect(projectId, hnSearchQuery)
            : Promise.resolve(ResultEx.success({ count: 0 })),
        ]);

      const marketData = marketResult.isSuccess ? marketResult.data : null;
      const competitorData = competitorResult.isSuccess ? competitorResult.data : null;
      const autocompleteInsights = autocompleteResult.isSuccess ? autocompleteResult.data : null;
      const academicPapers = academicPapersResult.isSuccess ? academicPapersResult.data : null;
      const hnSearchCount = hnSearchResult.isSuccess ? hnSearchResult.data.count : 0;

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
        academicPapers: academicPapers ?? existing?.academicPapers ?? null,
        lastResearchRunAt: now,
        updatedAt: now,
        researchStatus: 'idle',
        researchStatusUpdatedAt: now,
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
        academicPapersCollected: academicPapers != null,
        hnSearchCommentsCollected: hnSearchCount > 0,
      });
    } catch (error) {
      this._logger.error('collect-research-data.exception', { projectId, error });
      await this._researchDataRepository.updateResearchStatus(projectId, 'idle');
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

  /** Build a short search query for HN Algolia (3–5 keywords, no punctuation). */
  private buildHnSearchQuery(intent: ResearchIntent): string | null {
    const text = (intent.topic ?? intent.productDescription ?? '').trim();
    if (!text) return null;
    const words = text
      .replace(/[.!?,;:()\-–—]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 1)
      .slice(0, 5)
      .join(' ')
      .trim();
    return words.length >= 3 ? words : null;
  }
}
