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
import type { SynthesisLlmPort } from '../ports/synthesis-llm.port';
import { CalculateMetricsUseCase } from '../../../metrics/application/use-cases/calculate-metrics.use-case';
import { ResearchNotFoundError } from '../../domain/errors/research.error';
import type { SynthesisReport } from '../../domain/value-objects/synthesis-report.vo';
import type { StoredResearchData } from '../../domain/value-objects/stored-research-data.vo';
import type {
  GenerateSynthesisRequest,
  GenerateSynthesisResponse,
} from './input-output/generate-synthesis.io';

@injectable()
export class GenerateSynthesisUseCase {
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
    private readonly _researchDataRepository: ResearchDataRepositoryPort,
    @inject(RESEARCH_TYPES.SynthesisLlm)
    private readonly _synthesisLlm: SynthesisLlmPort
  ) {}

  async execute(
    request: GenerateSynthesisRequest
  ): Promise<ResultEx<GenerateSynthesisResponse, ResearchNotFoundError | Error>> {
    const { projectId } = request;
    this._logger.info('generate-synthesis.start', { projectId });

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

      const hypothesisSummary = project.hypothesis?.description ?? project.name ?? 'No hypothesis';
      const marketSummary = this.summarizeMarket(project.marketContext, stored?.marketData ?? null);
      const competitorSummary = this.summarizeCompetitors(stored?.competitorData ?? null);
      const autocompleteSummary = this.summarizeAutocomplete(stored?.autocompleteInsights ?? null);
      const templateSlug = project.scenarioTemplateSlug ?? 'wtp';
      const metricsResult = await this._calculateMetricsUseCase.execute({ projectId, templateSlug });
      const userInsightsSummary = metricsResult.isSuccess
        ? this.summarizeMetrics(metricsResult.data.metrics)
        : 'No metrics yet';
      const earlySignalsSummary =
        signals.length > 0
          ? signals.map((s) => `[${s.type}] ${s.title}: ${s.description}`).join('. ')
          : 'No early signals yet';

      const llmResult = await this._synthesisLlm.generateSynthesis({
        projectName: project.name,
        hypothesisSummary,
        marketSummary,
        competitorSummary,
        autocompleteSummary,
        userInsightsSummary,
        earlySignalsSummary,
      });

      if (!llmResult.isSuccess) {
        return ResultEx.failure(llmResult.error);
      }

      const report: SynthesisReport = llmResult.data;
      const updatedStored: StoredResearchData = {
        projectId,
        marketData: stored?.marketData ?? null,
        competitorData: stored?.competitorData ?? null,
        autocompleteInsights: stored?.autocompleteInsights ?? null,
        synthesisReport: report,
        updatedAt: new Date(),
      };
      await this._researchDataRepository.save(updatedStored);

      return ResultEx.success({ report });
    } catch (error) {
      this._logger.error('generate-synthesis.exception', { projectId, error });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  private summarizeMarket(
    marketContext: { marketPicture?: string; marketFit?: string; differentiation?: string } | null,
    marketData: StoredResearchData['marketData']
  ): string {
    if (marketData?.size || marketData?.growth || (marketData?.trends && marketData.trends.length > 0)) {
      return [marketData.size, marketData.growth, marketData.trends?.join(', ')].filter(Boolean).join('. ');
    }
    const parts = [marketContext?.marketPicture, marketContext?.marketFit, marketContext?.differentiation].filter(
      Boolean
    );
    return parts.length > 0 ? parts.join('. ') : 'No market data';
  }

  private summarizeAutocomplete(autocomplete: StoredResearchData['autocompleteInsights']): string {
    if (!autocomplete || autocomplete.results.length === 0) return 'No autocomplete data';
    const lines: string[] = [];
    for (const r of autocomplete.results) {
      if (r.suggestions.length > 0) {
        lines.push(`"${r.phrase}" → ${r.suggestions.slice(0, 5).join('; ')}`);
      }
    }
    return lines.length > 0 ? lines.join('. ') : 'No suggestions';
  }

  private summarizeCompetitors(competitorData: StoredResearchData['competitorData']): string {
    if (!competitorData) return 'No competitor data';
    const parts = [
      competitorData.competitors?.length ? competitorData.competitors.join(', ') : '',
      competitorData.priceRange,
      competitorData.rating,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join('. ') : 'No competitor data';
  }

  private summarizeMetrics(metrics: {
    problemSeverity?: { average: number };
    wtp?: { median: number };
    featureScore?: { average: number };
    valueMatchScore?: { average: number };
  }): string {
    const parts: string[] = [];
    if (metrics.wtp?.median != null) parts.push(`WTP median: $${metrics.wtp.median}/mo`);
    const avg =
      metrics.problemSeverity?.average ?? metrics.featureScore?.average ?? metrics.valueMatchScore?.average;
    if (avg != null) parts.push(`Score avg: ${avg.toFixed(1)}/5`);
    return parts.length > 0 ? parts.join('; ') : 'No metrics';
  }
}
