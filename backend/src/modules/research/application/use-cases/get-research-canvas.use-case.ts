import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
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
  MarketDataBlock,
  CompetitorInfoBlock,
  UserInsightsBlock,
} from '../../domain/entities';
import { ResearchNotFoundError } from '../../domain/errors/research.error';
import type {
  GetResearchCanvasRequest,
  GetResearchCanvasResponse,
  RecommendedTemplate,
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
      const userInsights: UserInsightsBlock = await this.buildUserInsightsBlock(projectId, project.scenarioTemplateSlug ?? 'wtp', signals);

      const canvas: ResearchCanvas = {
        projectId,
        marketData,
        competitorInfo,
        userInsights,
      };

      const recommendedTemplate = this.getRecommendedTemplate(project.scenarioTemplateSlug ?? 'wtp');

      return ResultEx.success({ canvas, projectName: project.name, recommendedTemplate });
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

  private buildMarketDataBlock(stored: MarketDataBlock | null): MarketDataBlock {
    if (stored?.size || stored?.growth || (stored?.trends && stored.trends.length > 0)) {
      return stored;
    }
    return { size: undefined, growth: undefined, trends: [] };
  }

  private async buildUserInsightsBlock(
    projectId: string,
    templateSlug: string,
    signals: Array<{ type: string; title: string; description: string }>
  ): Promise<UserInsightsBlock> {
    const topPains = signals
      .filter((s) => s.type === 'negative' || s.type === 'critical_risk' || s.type === 'pain_point')
      .slice(0, 5)
      .map((s) => s.title);
    let wtp: string | undefined;
    let retentionHint: string | undefined;

    const metricsResult = await this._calculateMetricsUseCase.execute({ projectId, templateSlug });
    if (metricsResult.isSuccess && metricsResult.data.metrics) {
      const m = metricsResult.data.metrics;
      if (m.wtp?.median != null) wtp = `$${m.wtp.median}/mo`;
      const avg = m.problemSeverity?.average ?? m.featureScore?.average ?? m.valueMatchScore?.average;
      if (avg != null) retentionHint = `Score avg: ${avg.toFixed(1)}/5`;
    }

    return { topPains: topPains.length ? topPains : undefined, wtp, retentionHint };
  }
}
