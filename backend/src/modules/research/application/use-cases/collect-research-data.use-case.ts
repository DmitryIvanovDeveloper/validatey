import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
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
import type { RedditSearchCommentsCollectorPort } from '../ports/reddit-search-comments-collector.port';
import type { ProductHuntProviderPort } from '../ports/product-hunt-provider.port';
import { ResearchNotFoundError, ResearchCooldownError } from '../../domain/errors/research.error';
import type { StoredResearchData } from '../../domain/value-objects/stored-research-data.vo';
import { CheckResearchAvailabilityUseCase } from './check-research-availability.use-case';
import type {
  CollectResearchDataRequest,
  CollectResearchDataResponse,
  ResearchIntent,
} from './input-output/collect-research-data.io';

const AI_PROXY_URL =
  process.env.SYNTHESIS_LLM_URL ||
  process.env.LLM_SERVICE_URL ||
  'https://cerebras-api.vercel.app/api/prompt';

const SEARCH_QUERY_PROMPT = `You are a search query expert. Given a startup hypothesis and optional target segment/audience, generate ONE short English search query to find relevant community discussions on Reddit and Hacker News (where this audience actually talks).

Rules:
- Output ONLY the query string. No quotes, no explanation, no punctuation at the end.
- 3-5 words ONLY.
- Focus on the CORE PROBLEM or BEHAVIOR the hypothesis addresses — not the product or solution.
- If target segment/audience is provided, choose query wording that matches how THAT audience discusses the problem (e.g. "bloggers content ideas" for content creators, "founders honest feedback" for founders).
- Use plain everyday language that real people use in forum discussions (not academic terms).
- Do NOT use: hypothesis, startup, platform, app, product, validation, business, AI, ML, software, technology, digital, online, system.
- Do NOT use the project name literally.
- Examples for context:
  - "founders need honest feedback" (for a peer-feedback platform)
  - "reciprocal feedback community" (for give-to-get mechanic)
  - "freelancer client trust" (for payment escrow app)
  - "remote team async communication" (for async video tool)
  - "bloggers content creation workflow" (for content-creator tools)`;

@injectable()
export class CollectResearchDataUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(ROOT_TYPES.HttpClient)
    private readonly _http: HttpClientPort,
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
    private readonly _hnSearchCollector: HnSearchCommentsCollectorPort,
    @inject(RESEARCH_TYPES.RedditSearchCommentsCollector)
    private readonly _redditSearchCollector: RedditSearchCommentsCollectorPort,
    @inject(RESEARCH_TYPES.ProductHuntProvider)
    private readonly _productHuntProvider: ProductHuntProviderPort
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

      const searchQuery = await this.buildSearchQuery(intent);

      const [marketResult, competitorResult, autocompleteResult, academicPapersResult, hnSearchResult, redditSearchResult, productHuntResult] =
        await Promise.all([
          this._marketDataProvider.fetchMarketData(projectId, intent),
          this._competitorDataProvider.fetchCompetitorData(projectId, intent),
          autocompletePromise,
          this._academicPapersProvider.fetchAcademicPapers(projectId, intent),
          searchQuery
            ? this._hnSearchCollector.collect(projectId, searchQuery)
            : Promise.resolve(ResultEx.success({ count: 0 })),
          searchQuery
            ? this._redditSearchCollector.collect(projectId, searchQuery)
            : Promise.resolve(ResultEx.success({ count: 0 })),
          searchQuery
            ? this._productHuntProvider.fetchProductHunt(projectId, searchQuery)
            : Promise.resolve(ResultEx.success(null)),
        ]);

      const marketData = marketResult.isSuccess ? marketResult.data : null;
      const competitorData = competitorResult.isSuccess ? competitorResult.data : null;
      const autocompleteInsights = autocompleteResult.isSuccess ? autocompleteResult.data : null;
      const academicPapers = academicPapersResult.isSuccess ? academicPapersResult.data : null;
      const hnSearchCount = hnSearchResult.isSuccess ? hnSearchResult.data.count : 0;
      const redditSearchCount = redditSearchResult.isSuccess ? redditSearchResult.data.count : 0;
      const productHunt = productHuntResult.isSuccess ? productHuntResult.data : null;

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
        productHunt: productHunt ?? existing?.productHunt ?? null,
        userStories: existing?.userStories ?? null,
        userStoriesGeneratedAt: existing?.userStoriesGeneratedAt ?? null,
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
        redditSearchCommentsCollected: redditSearchCount > 0,
        productHuntCollected: productHunt != null,
      });
    } catch (error) {
      this._logger.error('collect-research-data.exception', { projectId, error });
      await this._researchDataRepository.updateResearchStatus(projectId, 'idle');
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  private buildResearchIntent(
    project: {
      name: string;
      hypothesis?: { description?: string } | null;
      segment?: { description?: string; demographics?: Record<string, unknown> } | null;
    },
    request: CollectResearchDataRequest
  ): ResearchIntent {
    const topic = [project.name, project.hypothesis?.description].filter(Boolean).join('. ').trim() || '';
    const segment =
      request.segment ??
      this.formatSegmentForIntent(project.segment);
    return {
      topic,
      geography: request.geography,
      segment,
      productDescription: request.productDescription ?? project.hypothesis?.description,
    };
  }

  /** Build a single segment string from description + demographics for LLM context (search query, market, etc.). */
  private formatSegmentForIntent(segment: { description?: string; demographics?: Record<string, unknown> } | null | undefined): string | undefined {
    if (!segment) return undefined;
    const desc = typeof segment.description === 'string' ? segment.description.trim() : '';
    const demo = segment.demographics;
    let demographicsStr = '';
    if (demo && typeof demo === 'object') {
      if (typeof (demo as { text?: string }).text === 'string') {
        demographicsStr = (demo as { text: string }).text.trim();
      } else {
        const parts = Object.entries(demo)
          .filter(([, v]) => v != null && v !== '')
          .map(([k, v]) => `${k}: ${String(v)}`);
        demographicsStr = parts.join(' | ');
      }
    }
    const combined = [desc, demographicsStr].filter(Boolean).join('. ');
    return combined.length > 0 ? combined.slice(0, 500) : undefined;
  }

  /**
   * Generate a short search query (3–5 words) via LLM for HN and Reddit search.
   * Uses hypothesis and optional segment/demographics so the query targets the right audience.
   * Falls back to regex-based extraction if LLM fails.
   */
  private async buildSearchQuery(intent: ResearchIntent): Promise<string | null> {
    const text = (intent.productDescription ?? intent.topic ?? '').trim();
    if (!text) return null;

    const firstSentence = text.split(/[.!?\n]/)[0]?.trim() ?? text;
    const hypothesisPart = firstSentence.slice(0, 400);
    const segmentPart = (intent.segment ?? '').trim().slice(0, 300);
    const prompt =
      segmentPart.length > 0
        ? `${SEARCH_QUERY_PROMPT}\n\nHypothesis: ${hypothesisPart}\n\nTarget audience / segment (use to tailor the query): ${segmentPart}`
        : `${SEARCH_QUERY_PROMPT}\n\nHypothesis: ${hypothesisPart}`;

    if (segmentPart.length > 0) {
      this._logger.info('collect-research-data.search-query-with-segment', { segmentLength: segmentPart.length });
    }

    try {
      const response = await this._http.post<{ response?: string }>(
        AI_PROXY_URL,
        {
          prompt,
          model: 'llama3.3-70b',
          max_tokens: 32,
        },
        {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; Validatey/1.0)',
        }
      );

      const q = (response?.response ?? '').trim().replace(/^["'`]|["'`]$/g, '').replace(/\.$/, '').trim();

      if (q && q.split(/\s+/).length >= 2 && q.split(/\s+/).length <= 8) {
        this._logger.info('collect-research-data.search-query-llm', { query: q });
        return q;
      }
    } catch (err) {
      this._logger.warn('collect-research-data.search-query-llm-failed', {
        error: err instanceof Error ? err.message : String(err),
      });
    }

    // Fallback: extract meaningful words via stop-word filter
    const STOP_WORDS = new Set([
      'a','an','the','and','or','but','if','we','our','their','its','is','are','was',
      'be','been','by','for','of','on','in','to','do','at','as','so','it','no','not',
      'with','that','this','from','then','than','when','who','how','all','any','will',
      'can','may','has','have','had','only','after','within','least','most',
      'first','more','also','just','about','into','out','up','what','which','they',
    ]);

    const words = text
      .replace(/[.!?,;:()\-–—"'`]/g, ' ')
      .split(/\s+/)
      .map((w) => w.toLowerCase())
      .filter((w) => w.length >= 4 && !STOP_WORDS.has(w))
      .slice(0, 5);

    return words.length >= 2 ? words.join(' ') : null;
  }
}
