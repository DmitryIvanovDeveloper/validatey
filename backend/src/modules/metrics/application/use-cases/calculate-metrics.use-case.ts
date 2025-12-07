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

      // Calculate problem severity metrics
      if (data.problemSeverityScores.length === 0) {
        return ResultEx.failure(new InsufficientDataError('No problem severity scores available'));
      }

      const sortedScores = [...data.problemSeverityScores].sort((a, b) => a - b);
      const average = sortedScores.reduce((sum, score) => sum + score, 0) / sortedScores.length;
      const median = this.calculateMedian(sortedScores);
      const highScoresCount = sortedScores.filter((score) => score >= 4).length;
      const criticalScoresCount = sortedScores.filter((score) => score >= 4.5).length;

      // Calculate WTP statistics
      if (data.wtpValues.length === 0) {
        return ResultEx.failure(new InsufficientDataError('No WTP values available'));
      }

      const sortedWTP = [...data.wtpValues].sort((a, b) => a - b);
      const wtpMedian = this.calculateMedian(sortedWTP);
      const wtpMean = sortedWTP.reduce((sum, val) => sum + val, 0) / sortedWTP.length;
      const wtpPercentile25 = this.calculatePercentile(sortedWTP, 25);
      const wtpPercentile75 = this.calculatePercentile(sortedWTP, 75);

      // Calculate confidence interval for WTP (if enough data)
      let confidenceInterval;
      if (sortedWTP.length >= 30) {
        const stdDev = this.calculateStandardDeviation(sortedWTP, wtpMean);
        const margin = 1.96 * (stdDev / Math.sqrt(sortedWTP.length)); // 95% confidence
        confidenceInterval = {
          lower: wtpMean - margin,
          upper: wtpMean + margin,
        };
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

      // Save calculated metrics
      await this._repository.saveProblemSeverity(
        request.projectId,
        ProblemSeverityScore.create(average)
      );
      await this._repository.saveWTPStatistics(request.projectId, {
        median: wtpMedian,
        mean: wtpMean,
        percentile25: wtpPercentile25,
        percentile75: wtpPercentile75,
      });

      if (clusters.length > 0) {
        const ClusterVO = (await import('../../domain/value-objects/cluster.vo')).ClusterVO;
        const clusterVOs = clusters.map((c, idx) =>
          ClusterVO.create(
            c.id || `cluster_${Date.now()}_${idx}`,
            request.projectId,
            [], // quoteIds will be populated by clustering service
            c.theme,
            c.representativeQuote
          )
        );
        await this._repository.saveClusters(
          request.projectId,
          clusterVOs.map((c) => c.toData())
        );
      }

      this._logger.info('calculate-metrics.success', { projectId: request.projectId });

      return ResultEx.success({
        metrics: {
          problemSeverity: {
            average,
            median,
            highScoresCount,
            criticalScoresCount,
          },
          wtp: {
            median: wtpMedian,
            mean: wtpMean,
            percentile25: wtpPercentile25,
            percentile75: wtpPercentile75,
            confidenceInterval,
          },
          clusters,
        },
      });
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


