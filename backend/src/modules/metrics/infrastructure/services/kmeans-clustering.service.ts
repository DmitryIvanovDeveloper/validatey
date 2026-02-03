import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { ClusteringServicePort, ClusterQuotes } from '../../application/ports/clustering-service.port';
import { ClusteringError } from '../../domain/errors/metrics.error';
import { ClusterVO } from '../../domain/value-objects/cluster.vo';

@injectable()
export class KMeansClusteringService implements ClusteringServicePort {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}

  async clusterQuotes(
    quotes: ClusterQuotes[],
    k: number = 5
  ): Promise<ResultEx<import('../../domain/value-objects/cluster.vo').Cluster[], ClusteringError>> {
    this._logger.info('kmeans-clustering-service.cluster-quotes.start', { quoteCount: quotes.length, k });

    try {
      if (quotes.length < k) {
        return ResultEx.failure(new ClusteringError(`Not enough quotes (${quotes.length}) for ${k} clusters`));
      }

      // Simple K-means implementation
      const clusters = this.kmeans(quotes, k);

      // Convert to domain objects
      const clusterVOs = clusters.map((cluster, idx) => {
        const representativeQuote = cluster.quotes[0]?.text || '';
        const theme = this.extractTheme(cluster.quotes.map((q) => q.text));

        return ClusterVO.create(
          `cluster_${Date.now()}_${idx}`,
          '', // projectId will be set by use case
          cluster.quotes.map((q) => q.id),
          theme,
          representativeQuote
        );
      });

      this._logger.info('kmeans-clustering-service.cluster-quotes.success', {
        clusterCount: clusterVOs.length,
      });

      return ResultEx.success(clusterVOs.map((c) => c.toData()));
    } catch (error) {
      this._logger.error('kmeans-clustering-service.cluster-quotes.error', { error });
      return ResultEx.failure(
        new ClusteringError(error instanceof Error ? error.message : 'Unknown error')
      );
    }
  }

  private kmeans(quotes: ClusterQuotes[], k: number): Array<{ quotes: ClusterQuotes[]; centroid: number[] }> {
    // Initialize centroids randomly
    const centroids: number[][] = [];
    for (let i = 0; i < k; i++) {
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      centroids.push([...randomQuote.embedding]);
    }

    let clusters: Array<{ quotes: ClusterQuotes[]; centroid: number[] }>;
    let iterations = 0;
    const maxIterations = 100;

    do {
      // Assign quotes to nearest centroid
      clusters = centroids.map((centroid) => ({ quotes: [], centroid: [...centroid] }));

      for (const quote of quotes) {
        let minDistance = Infinity;
        let nearestCluster = 0;

        for (let i = 0; i < centroids.length; i++) {
          const distance = this.euclideanDistance(quote.embedding, centroids[i]);
          if (distance < minDistance) {
            minDistance = distance;
            nearestCluster = i;
          }
        }

        clusters[nearestCluster].quotes.push(quote);
      }

      // Update centroids
      let changed = false;
      for (let i = 0; i < clusters.length; i++) {
        if (clusters[i].quotes.length === 0) continue;

        const newCentroid = this.calculateCentroid(clusters[i].quotes.map((q) => q.embedding));
        if (!this.vectorsEqual(centroids[i], newCentroid)) {
          centroids[i] = newCentroid;
          changed = true;
        }
      }

      if (!changed) break;
      iterations++;
    } while (iterations < maxIterations);

    return clusters.filter((c) => c.quotes.length > 0);
  }

  private euclideanDistance(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same dimension');
    }
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += Math.pow(a[i] - b[i], 2);
    }
    return Math.sqrt(sum);
  }

  private calculateCentroid(vectors: number[][]): number[] {
    if (vectors.length === 0) return [];
    const dimension = vectors[0].length;
    const centroid = new Array(dimension).fill(0);

    for (const vector of vectors) {
      for (let i = 0; i < dimension; i++) {
        centroid[i] += vector[i];
      }
    }

    return centroid.map((sum) => sum / vectors.length);
  }

  private vectorsEqual(a: number[], b: number[]): boolean {
    if (a.length !== b.length) return false;
    const threshold = 0.0001;
    for (let i = 0; i < a.length; i++) {
      if (Math.abs(a[i] - b[i]) > threshold) return false;
    }
    return true;
  }

  private extractTheme(quotes: string[]): string {
    // Simple theme extraction - in production, use LLM
    const words = quotes
      .join(' ')
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3);
    const wordFreq = new Map<string, number>();
    words.forEach((word) => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });
    const sortedWords = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([word]) => word);
    return sortedWords.join(', ') || 'General feedback';
  }
}



