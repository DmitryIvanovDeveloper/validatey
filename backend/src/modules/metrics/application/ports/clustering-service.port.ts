import ResultEx from '../../../../infrastructure/result/result';
import { Cluster } from '../../domain/value-objects/cluster.vo';
import { ClusteringError } from '../../domain/errors/metrics.error';

export interface ClusterQuotes {
  readonly id: string;
  readonly text: string;
  readonly embedding: number[];
}

export interface ClusteringServicePort {
  clusterQuotes(quotes: ClusterQuotes[], k?: number): Promise<ResultEx<Cluster[], ClusteringError>>;
}



