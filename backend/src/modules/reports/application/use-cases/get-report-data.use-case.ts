import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { ReportGenerationError } from '../../domain/errors/report.error';
import type { ProjectRepositoryPort } from '../../../projects/application/ports/project-repository.port';
import { TYPES as PROJECT_TYPES } from '../../../projects/infrastructure/bootstrap/types';
import { CalculateMetricsUseCase } from '../../../metrics/application/use-cases/calculate-metrics.use-case';
import { TYPES as METRICS_TYPES } from '../../../metrics/infrastructure/bootstrap/types';
import type { GetReportDataRequest, ReportViewDto } from './input-output/get-report-data.io';

@injectable()
export class GetReportDataUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(PROJECT_TYPES.ProjectRepository)
    private readonly _projectRepository: ProjectRepositoryPort,
    @inject(METRICS_TYPES.CalculateMetricsUseCase)
    private readonly _calculateMetricsUseCase: CalculateMetricsUseCase
  ) {}

  async execute(
    request: GetReportDataRequest
  ): Promise<ResultEx<ReportViewDto, ReportGenerationError>> {
    const { projectId } = request;
    this._logger.info('get-report-data.start', { projectId });

    try {
      const projectResult = await this._projectRepository.findById(projectId);
      if (!projectResult.isSuccess) {
        return ResultEx.failure(new ReportGenerationError('Project not found'));
      }
      const project = projectResult.data;
      const templateSlug = project.scenarioTemplateSlug ?? 'wtp';

      const metricsResult = await this._calculateMetricsUseCase.execute({
        projectId,
        templateSlug,
      });
      if (!metricsResult.isSuccess) {
        this._logger.warn('get-report-data.insufficient-data', { projectId, error: metricsResult.error?.message });
        return ResultEx.failure(
          new ReportGenerationError(metricsResult.error?.message ?? 'Insufficient data for report')
        );
      }

      const m = metricsResult.data.metrics;
      const average =
        m.problemSeverity?.average ?? m.featureScore?.average ?? m.valueMatchScore?.average ?? 0;
      const verdictType: 'positive' | 'negative' | 'neutral' =
        average >= 4 ? 'positive' : average <= 2 ? 'negative' : 'neutral';
      const verdict =
        verdictType === 'positive'
          ? 'Hypothesis confirmed with positive signals'
          : verdictType === 'negative'
            ? 'Hypothesis needs revision based on feedback'
            : 'More data or refinement needed';

      const flatMetrics: Record<string, number | string> = {
        satisfaction_score: Number(average.toFixed(2)),
        nps: Number(((average / 5) * 10).toFixed(1)),
      };
      if (m.problemSeverity) {
        flatMetrics.problem_severity_avg = m.problemSeverity.average;
        flatMetrics.problem_severity_median = m.problemSeverity.median;
        flatMetrics.high_scores_count = m.problemSeverity.highScoresCount;
        flatMetrics.critical_scores_count = m.problemSeverity.criticalScoresCount;
      }
      if (m.wtp) {
        flatMetrics.wtp_median = m.wtp.median;
        flatMetrics.wtp_mean = m.wtp.mean;
      }
      if (m.featureScore) {
        flatMetrics.feature_score_avg = m.featureScore.average;
        flatMetrics.feature_score_response_count = m.featureScore.responseCount;
      }
      if (m.valueMatchScore) {
        flatMetrics.value_match_avg = m.valueMatchScore.average;
        flatMetrics.value_match_response_count = m.valueMatchScore.responseCount;
      }

      const clustersArray = m.clusters ?? [];
      const clusters: ReportViewDto['clusters'] = {};
      clustersArray.forEach((c) => {
        clusters[c.theme] = { size: c.size, representativeQuote: c.representativeQuote };
      });

      const wtp = m.wtp?.median ?? m.wtp?.mean ?? 0;
      const alternatives =
        clustersArray.length > 0
          ? clustersArray.map((c) => c.representativeQuote || c.theme).slice(0, 5)
          : ['Review open-ended responses for alternatives'];
      const recommendations =
        clustersArray.length > 0
          ? clustersArray.map((c) => `Focus on cluster: ${c.theme} (${c.size} respondents)`)
          : ['Collect more responses for reliable insights'];

      const dto: ReportViewDto = {
        verdict,
        verdictType,
        metrics: flatMetrics,
        clusters,
        alternatives,
        wtp,
        recommendations,
      };

      this._logger.info('get-report-data.success', { projectId });
      return ResultEx.success(dto);
    } catch (error) {
      this._logger.error('get-report-data.error', { projectId, error });
      return ResultEx.failure(
        new ReportGenerationError(error instanceof Error ? error.message : 'Unknown error')
      );
    }
  }
}
