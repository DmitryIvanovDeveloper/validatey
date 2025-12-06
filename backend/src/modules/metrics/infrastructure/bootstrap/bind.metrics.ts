import { Container } from 'inversify';
import { TYPES } from './types';
import { MetricsRepositoryPort } from '../../application/ports/metrics-repository.port';
import { SupabaseMetricsRepository } from '../repositories/supabase-metrics.repository';
import { ClusteringServicePort } from '../../application/ports/clustering-service.port';
import { KMeansClusteringService } from '../services/kmeans-clustering.service';
import { RecommendationEngineService } from '../services/recommendation-engine.service';
import { CalculateMetricsUseCase } from '../../application/use-cases/calculate-metrics.use-case';
import { MetricsPresenter } from '../../interface-adapters/presenters/metrics.presenter';

export function bindMetrics(container: Container): void {
  // Repository
  container.bind<MetricsRepositoryPort>(TYPES.MetricsRepository).to(SupabaseMetricsRepository);

  // Services
  container.bind<ClusteringServicePort>(TYPES.ClusteringService).to(KMeansClusteringService);
  container.bind<RecommendationEngineService>(TYPES.RecommendationEngine).to(RecommendationEngineService);

  // Use Cases
  container.bind<CalculateMetricsUseCase>(TYPES.CalculateMetricsUseCase).to(CalculateMetricsUseCase);

  // Presenter
  container.bind<MetricsPresenter>(TYPES.MetricsPresenter).to(MetricsPresenter);
}

