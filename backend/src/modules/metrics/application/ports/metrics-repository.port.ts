import ResultEx from '../../../../infrastructure/result/result';
import { ProblemSeverityScore } from '../../domain/value-objects/problem-severity-score.vo';
import { WTPValue } from '../../domain/value-objects/wtp-value.vo';
import { Cluster } from '../../domain/value-objects/cluster.vo';

export interface MetricsData {
  readonly projectId: string;
  readonly problemSeverityScores: number[];
  readonly wtpValues: number[];
  readonly quotes: Array<{
    id: string;
    text: string;
    embedding?: number[];
  }>;
}

export interface MetricsRepositoryPort {
  getMetricsData(projectId: string): Promise<ResultEx<MetricsData, Error>>;
  saveProblemSeverity(projectId: string, score: ProblemSeverityScore): Promise<ResultEx<void, Error>>;
  saveWTPStatistics(projectId: string, statistics: {
    median: number;
    mean: number;
    percentile25: number;
    percentile75: number;
  }): Promise<ResultEx<void, Error>>;
  saveClusters(projectId: string, clusters: Cluster[]): Promise<ResultEx<void, Error>>;
}

