import ResultEx from '../../../../infrastructure/result/result';
import type { StoredResearchData } from '../../domain/entities/stored-research-data.entity';

export interface ResearchDataRepositoryPort {
  findByProjectId(projectId: string): Promise<ResultEx<StoredResearchData | null, Error>>;
  save(data: StoredResearchData): Promise<ResultEx<void, Error>>;
}
