import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { getSupabaseClient } from '../../../../infrastructure/database/supabase-client';
import { ProblemSeverityScore } from '../../domain/value-objects/problem-severity-score.vo';
import { Cluster } from '../../domain/value-objects/cluster.vo';
import { MetricsRepositoryPort, MetricsData } from '../../application/ports/metrics-repository.port';

@injectable()
export class SupabaseMetricsRepository implements MetricsRepositoryPort {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}

  async getMetricsData(projectId: string): Promise<ResultEx<MetricsData, Error>> {
    try {
      const supabase = getSupabaseClient();

      // Get responses with answers
      const { data: responses, error: responsesError } = await supabase
        .from('responses')
        .select('id, answers')
        .eq('project_id', projectId);

      if (responsesError) {
        this._logger.error('supabase-metrics-repository.get-data-error', { error: responsesError });
        return ResultEx.failure(new Error(responsesError.message));
      }

      const problemSeverityScores: number[] = [];
      const wtpValues: number[] = [];
      const quotes: Array<{ id: string; text: string; embedding?: number[] }> = [];

      // Extract metrics from responses
      for (const response of responses || []) {
        const answers = response.answers as Record<string, any>;
        if (answers) {
          // Extract problem severity scores (assuming field name 'problemSeverity' or similar)
          if (answers.problemSeverity && typeof answers.problemSeverity === 'number') {
            problemSeverityScores.push(answers.problemSeverity);
          }
          // Extract WTP values
          if (answers.wtp && typeof answers.wtp === 'number') {
            wtpValues.push(answers.wtp);
          }
          // Extract quotes (text answers)
          if (answers.quotes && Array.isArray(answers.quotes)) {
            answers.quotes.forEach((quote: any) => {
              quotes.push({
                id: `${response.id}_quote_${quotes.length}`,
                text: typeof quote === 'string' ? quote : quote.text || '',
              });
            });
          }
        }
      }

      // Get embeddings for quotes
      const { data: embeddings } = await supabase
        .from('response_embeddings')
        .select('response_id, embedding')
        .in(
          'response_id',
          responses?.map((r) => r.id) || []
        );

      // Match embeddings to quotes
      if (embeddings) {
        const embeddingMap = new Map(embeddings.map((e) => [e.response_id, e.embedding]));
        quotes.forEach((quote) => {
          const responseId = quote.id.split('_quote_')[0];
          const embedding = embeddingMap.get(responseId);
          if (embedding) {
            quote.embedding = Array.isArray(embedding) ? embedding : JSON.parse(embedding as any);
          }
        });
      }

      return ResultEx.success({
        projectId,
        problemSeverityScores,
        wtpValues,
        quotes,
      });
    } catch (error) {
      this._logger.error('supabase-metrics-repository.get-data-exception', { error });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async saveProblemSeverity(projectId: string, score: ProblemSeverityScore): Promise<ResultEx<void, Error>> {
    // TODO: Save to a metrics table or update project metadata
    this._logger.info('supabase-metrics-repository.save-problem-severity', { projectId, score: score.value });
    return ResultEx.success(undefined);
  }

  async saveWTPStatistics(
    projectId: string,
    statistics: { median: number; mean: number; percentile25: number; percentile75: number }
  ): Promise<ResultEx<void, Error>> {
    // TODO: Save to a metrics table or update project metadata
    this._logger.info('supabase-metrics-repository.save-wtp-statistics', { projectId, statistics });
    return ResultEx.success(undefined);
  }

  async saveClusters(projectId: string, clusters: Cluster[]): Promise<ResultEx<void, Error>> {
    // TODO: Save clusters to a clusters table
    this._logger.info('supabase-metrics-repository.save-clusters', { projectId, count: clusters.length });
    return ResultEx.success(undefined);
  }
}


