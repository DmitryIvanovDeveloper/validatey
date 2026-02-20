import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import { getSupabaseClient } from '../../../../infrastructure/database/supabase-client';
import ResultEx from '../../../../infrastructure/result/result';
import { TYPES as PROJECT_TYPES } from '../../../projects/infrastructure/bootstrap/types';
import { TYPES as SIGNALS_TYPES } from '../../../signals/infrastructure/bootstrap/types';
import { TYPES as METRICS_TYPES } from '../../../metrics/infrastructure/bootstrap/types';
import { TYPES as RESEARCH_TYPES } from '../../infrastructure/bootstrap/types';
import type { ProjectRepositoryPort } from '../../../projects/application/ports/project-repository.port';
import type { EarlySignalsRepositoryPort } from '../../../signals/application/ports/early-signals-repository.port';
import type { ResearchDataRepositoryPort } from '../ports/research-data-repository.port';
import { CalculateMetricsUseCase } from '../../../metrics/application/use-cases/calculate-metrics.use-case';
import type {
  ResearchCanvas,
  EarlySignal,
  MarketDataBlock,
  CompetitorInfoBlock,
  UserInsightsBlock,
  StoredResearchData,
} from '../../domain/value-objects';
import { ResearchNotFoundError } from '../../domain/errors/research.error';
import type {
  GetResearchCanvasRequest,
  GetResearchCanvasResponse,
  RecommendedTemplate,
  AssumptionStatus,
} from './input-output/get-research-canvas.io';

@injectable()
export class GetResearchCanvasUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(PROJECT_TYPES.ProjectRepository)
    private readonly _projectRepository: ProjectRepositoryPort,
    @inject(SIGNALS_TYPES.EarlySignalsRepository)
    private readonly _signalsRepository: EarlySignalsRepositoryPort,
    @inject(METRICS_TYPES.CalculateMetricsUseCase)
    private readonly _calculateMetricsUseCase: CalculateMetricsUseCase,
    @inject(RESEARCH_TYPES.ResearchDataRepository)
    private readonly _researchDataRepository: ResearchDataRepositoryPort
  ) {}

  async execute(
    request: GetResearchCanvasRequest
  ): Promise<ResultEx<GetResearchCanvasResponse, ResearchNotFoundError | Error>> {
    const { projectId } = request;
    this._logger.info('get-research-canvas.start', { projectId });

    try {
      const projectResult = await this._projectRepository.findById(projectId);
      if (!projectResult.isSuccess) {
        return ResultEx.failure(new ResearchNotFoundError(projectId));
      }
      const project = projectResult.data;

      const [storedResult, signalsResult] = await Promise.all([
        this._researchDataRepository.findByProjectId(projectId),
        this._signalsRepository.findByProjectId(projectId),
      ]);

      const stored = storedResult.isSuccess ? storedResult.data : null;
      const signals = signalsResult.isSuccess ? signalsResult.data : [];

      const marketData: MarketDataBlock = this.buildMarketDataBlock(stored?.marketData ?? null);
      const competitorInfo: CompetitorInfoBlock = stored?.competitorData ?? { competitors: [], priceRange: '', rating: '' };
      const userInsights: UserInsightsBlock = await this.buildUserInsightsBlock(projectId, project.scenarioTemplateSlug ?? 'wtp', signals, stored);

      const earlySignals = this.buildEarlySignalsBlock(signals, stored);

      const canvas: ResearchCanvas = {
        projectId,
        marketData,
        competitorInfo,
        userInsights,
        autocompleteInsights: stored?.autocompleteInsights ?? null,
        earlySignals,
      };

      const synthesisReport = stored?.synthesisReport ?? null;
      const recommendedTemplate = this.getRecommendedTemplate(project.scenarioTemplateSlug ?? 'wtp');
      const projectHypothesis = project.hypothesis?.description ?? undefined;
      const assumptionStatuses = this.buildAssumptionStatuses(
        project.hypothesis?.assumptions ?? [],
        synthesisReport?.verdict
      );

      const assumptionAssessments = stored?.assumptionAssessments ?? null;

      return ResultEx.success({
        canvas,
        synthesisReport,
        projectName: project.name,
        projectHypothesis,
        recommendedTemplate,
        assumptionStatuses,
        assumptionAssessments,
      });
    } catch (error) {
      this._logger.error('get-research-canvas.exception', { projectId, error });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  private getRecommendedTemplate(slug: string): RecommendedTemplate {
    const map: Record<string, { name: string; description: string }> = {
      wtp: {
        name: 'Problem Validation (WTP)',
        description: 'Validates problem severity and willingness to pay — best for problem–solution fit.',
      },
      'feature-demand': {
        name: 'Feature Validation',
        description: 'Measures interest in a specific feature and how respondents would use it.',
      },
      'value-prop': {
        name: 'Value Proposition Test',
        description: 'Tests how well your value proposition resonates with the target segment.',
      },
    };
    const entry = map[slug] ?? map.wtp;
    return { slug, name: entry.name, description: entry.description };
  }

  /**
   * Build per-assumption status list. Same order as project.hypothesis.assumptions.
   * For now uses overall synthesis verdict for all; later can be replaced by LLM/rules per assumption.
   */
  private buildAssumptionStatuses(
    assumptions: ReadonlyArray<{ id: string; text: string }>,
    verdict: string | undefined
  ): AssumptionStatus[] | null {
    if (assumptions.length === 0) return null;
    const status = this.verdictToAssumptionStatus(verdict);
    if (!status) return null;
    return assumptions.map(() => status);
  }

  private verdictToAssumptionStatus(verdict: string | undefined): AssumptionStatus | null {
    if (!verdict) return null;
    const v = String(verdict).toLowerCase().replace(/-/g, '_');
    if (v === 'validated' || v === 'strong_validation') return 'confirmed';
    if (v === 'rejected') return 'not_supported';
    if (v === 'needs_more_data') return 'need_more';
    return null;
  }

  private buildMarketDataBlock(stored: MarketDataBlock | null): MarketDataBlock {
    if (stored?.size || stored?.growth || (stored?.trends && stored.trends.length > 0)) {
      return stored;
    }
    return { size: undefined, growth: undefined, trends: [] };
  }

  private async buildUserInsightsBlock(
    projectId: string,
    templateSlug: string,
    signals: Array<{ type: string; title: string; description: string }>,
    storedResearchData: StoredResearchData | null
  ): Promise<UserInsightsBlock> {
    // Priority: research_data.userInsights > signals > metrics
    let topPains: string[] | undefined;
    let wtp: string | undefined;
    let retentionHint: string | undefined;

    // First priority: stored research data (UserInsightsBlock format)
    if (storedResearchData?.userInsights) {
      topPains = storedResearchData.userInsights.topPains
        ? [...storedResearchData.userInsights.topPains]
        : undefined;
      wtp = storedResearchData.userInsights.wtp;
      retentionHint = storedResearchData.userInsights.retentionHint;
    }

    // Second priority: build from research_data analysis (raw JSON format)
    if (!topPains || topPains.length === 0) {
      // Try to get painPoints directly from storedResearchData (our custom data)
      // We need to access the raw JSON from the database since StoredResearchData doesn't include it
      const rawData = await this.getRawUserInsightsFromDB(storedResearchData?.projectId || projectId);
      if (rawData?.painPoints) {
        topPains = rawData.painPoints
          .slice(0, 5)
          .map((p: any) => p.category || p.title || p);
      }
      if (rawData?.marketSignals?.wtp && !wtp) {
        wtp = rawData.marketSignals.wtp;
      }
    }

    // Third priority: signals table
    if (!topPains || topPains.length === 0) {
      topPains = signals
        .filter((s) => s.type === 'negative' || s.type === 'critical_risk' || s.type === 'pain_point')
        .slice(0, 5)
        .map((s) => s.title);
    }

    // Fourth priority: metrics calculation
    if (!wtp) {
      const metricsResult = await this._calculateMetricsUseCase.execute({ projectId, templateSlug });
      if (metricsResult.isSuccess && metricsResult.data.metrics) {
        const m = metricsResult.data.metrics;
        if (m.wtp?.median != null) wtp = `$${m.wtp.median}/mo`;
        const avg = m.problemSeverity?.average ?? m.featureScore?.average ?? m.valueMatchScore?.average;
        if (avg != null) retentionHint = `Score avg: ${avg.toFixed(1)}/5`;
      }
    }

    return { topPains: topPains?.length ? topPains : undefined, wtp, retentionHint };
  }

  private async getRawUserInsightsFromDB(projectId: string): Promise<any> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('research_data')
        .select('user_insights')
        .eq('project_id', projectId)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      return data.user_insights;
    } catch (error) {
      this._logger.error('Failed to get raw user insights from DB', { projectId, error });
      return null;
    }
  }

  private buildEarlySignalsBlock(signals: any[], storedResearchData: any): EarlySignal[] | null {
    // Priority: research_data userInsights > signals table
    if (storedResearchData?.projectId) {
      // Try to get from raw DB data
      // For now, we'll use signals as fallback since we need async call
    }

    // Fallback to signals table
    if (!signals || signals.length === 0) {
      return null;
    }

    return signals.map(signal => ({
      id: signal.id,
      type: signal.type,
      title: signal.title,
      description: signal.description,
    }));
  }
}
