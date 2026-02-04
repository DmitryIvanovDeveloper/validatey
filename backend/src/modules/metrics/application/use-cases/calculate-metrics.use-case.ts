import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { ProblemSeverityScore } from '../../domain/value-objects/problem-severity-score.vo';
import { WTPValue } from '../../domain/value-objects/wtp-value.vo';
import { InvalidMetricsDataError, InsufficientDataError } from '../../domain/errors/metrics.error';
import { MetricsRepositoryPort } from '../ports/metrics-repository.port';
import { ClusteringServicePort } from '../ports/clustering-service.port';
import { CalculateMetricsUseCaseRequest, CalculateMetricsUseCaseResponse } from './input-output/calculate-metrics.io';
import { TYPES } from '../../infrastructure/bootstrap/types';

@injectable()
export class CalculateMetricsUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(TYPES.MetricsRepository)
    private readonly _repository: MetricsRepositoryPort,
    @inject(TYPES.ClusteringService)
    private readonly _clusteringService: ClusteringServicePort
  ) {}

  async execute(
    request: CalculateMetricsUseCaseRequest
  ): Promise<ResultEx<CalculateMetricsUseCaseResponse, InvalidMetricsDataError | InsufficientDataError>> {
    this._logger.info('calculate-metrics.start', { projectId: request.projectId });

    try {
      const dataResult = await this._repository.getMetricsData(request.projectId);

      if (!dataResult.isSuccess) {
        this._logger.error('calculate-metrics.get-data-error', { error: dataResult.error });
        return ResultEx.failure(new InvalidMetricsDataError(dataResult.error.message));
      }

      const data = dataResult.data;
      const templateSlug = request.templateSlug ?? 'wtp';
      const isWtp = templateSlug === 'wtp';
      const isFeatureDemand = templateSlug === 'feature-demand';
      const isValueProp = templateSlug === 'value-prop';

      // Scale scores: used for problem severity (wtp), feature importance (feature-demand), or value match (value-prop)
      const scaleScores = data.problemSeverityScores.length > 0
        ? data.problemSeverityScores
        : [];

      if (scaleScores.length === 0) {
        return ResultEx.failure(new InsufficientDataError('No scale scores available for metrics'));
      }

      const sortedScores = [...scaleScores].sort((a, b) => a - b);
      const average = sortedScores.reduce((sum, score) => sum + score, 0) / sortedScores.length;
      const median = this.calculateMedian(sortedScores);
      const highScoresCount = sortedScores.filter((score) => score >= 4).length;
      const criticalScoresCount = sortedScores.filter((score) => score >= 4.5).length;

      let wtpMedian: number | undefined;
      let wtpMean: number | undefined;
      let wtpPercentile25: number | undefined;
      let wtpPercentile75: number | undefined;
      let confidenceInterval: { lower: number; upper: number } | undefined;

      if (isWtp) {
        if (data.wtpValues.length === 0) {
          return ResultEx.failure(new InsufficientDataError('No WTP values available'));
        }
        const sortedWTP = [...data.wtpValues].sort((a, b) => a - b);
        wtpMedian = this.calculateMedian(sortedWTP);
        wtpMean = sortedWTP.reduce((sum, val) => sum + val, 0) / sortedWTP.length;
        wtpPercentile25 = this.calculatePercentile(sortedWTP, 25);
        wtpPercentile75 = this.calculatePercentile(sortedWTP, 75);
        if (sortedWTP.length >= 30) {
          const stdDev = this.calculateStandardDeviation(sortedWTP, wtpMean);
          const margin = 1.96 * (stdDev / Math.sqrt(sortedWTP.length));
          confidenceInterval = { lower: wtpMean - margin, upper: wtpMean + margin };
        }
      }

      // Cluster quotes
      let clusters: Array<{ id: string; theme: string; representativeQuote: string; size: number }> = [];
      if (data.quotes.length >= 5) {
        const quotesWithEmbeddings = data.quotes.filter((q) => q.embedding && q.embedding.length > 0);
        if (quotesWithEmbeddings.length >= 5) {
          const k = Math.min(Math.ceil(quotesWithEmbeddings.length / 5), 10);
          const clusterResult = await this._clusteringService.clusterQuotes(
            quotesWithEmbeddings.map((q) => ({
              id: q.id,
              text: q.text,
              embedding: q.embedding!,
            })),
            k
          );

          if (clusterResult.isSuccess) {
            clusters = clusterResult.data.map((c) => ({
              id: c.id,
              theme: c.theme,
              representativeQuote: c.representativeQuote,
              size: c.size,
            }));
          }
        }
      }

      if (isWtp) {
        await this._repository.saveProblemSeverity(
          request.projectId,
          ProblemSeverityScore.create(average)
        );
        if (wtpMedian !== undefined && wtpMean !== undefined && wtpPercentile25 !== undefined && wtpPercentile75 !== undefined) {
          await this._repository.saveWTPStatistics(request.projectId, {
            median: wtpMedian,
            mean: wtpMean,
            percentile25: wtpPercentile25,
            percentile75: wtpPercentile75,
          });
        }
      }

      if (clusters.length > 0) {
        const ClusterVO = (await import('../../domain/value-objects/cluster.vo')).ClusterVO;
        const clusterVOs = clusters.map((c, idx) =>
          ClusterVO.create(
            c.id || `cluster_${Date.now()}_${idx}`,
            request.projectId,
            [],
            c.theme,
            c.representativeQuote
          )
        );
        await this._repository.saveClusters(
          request.projectId,
          clusterVOs.map((c) => c.toData())
        );
      }

      this._logger.info('calculate-metrics.success', { projectId: request.projectId, templateSlug });

      const metrics: CalculateMetricsUseCaseResponse['metrics'] = {
        clusters,
      };

      if (isWtp) {
        metrics.problemSeverity = { average, median, highScoresCount, criticalScoresCount };
        if (wtpMedian !== undefined && wtpMean !== undefined && wtpPercentile25 !== undefined && wtpPercentile75 !== undefined) {
          metrics.wtp = {
            median: wtpMedian,
            mean: wtpMean,
            percentile25: wtpPercentile25,
            percentile75: wtpPercentile75,
            confidenceInterval,
          };
        }
      }

      if (isFeatureDemand) {
        metrics.problemSeverity = { average, median, highScoresCount, criticalScoresCount };
        metrics.featureScore = {
          average,
          median,
          responseCount: scaleScores.length,
        };
      }

      if (isValueProp) {
        metrics.problemSeverity = { average, median, highScoresCount, criticalScoresCount };
        metrics.valueMatchScore = {
          average,
          median,
          responseCount: scaleScores.length,
        };
      }

      return ResultEx.success({ metrics });
    } catch (error) {
      this._logger.error('calculate-metrics.error', { error });
      if (error instanceof InvalidMetricsDataError || error instanceof InsufficientDataError) {
        return ResultEx.failure(error);
      }
      return ResultEx.failure(
        new InvalidMetricsDataError(error instanceof Error ? error.message : 'Unknown error')
      );
    }
  }

  private calculateMedian(sorted: number[]): number {
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  private calculatePercentile(sorted: number[], percentile: number): number {
    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  private calculateStandardDeviation(values: number[], mean: number): number {
    const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  }
}



