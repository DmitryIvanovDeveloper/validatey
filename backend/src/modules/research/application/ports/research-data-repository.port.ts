import ResultEx from '../../../../infrastructure/result/result';
import type { StoredResearchData } from '../../domain/value-objects/stored-research-data.vo';
import type { ResearchStatus } from '../../domain/value-objects/research-status.vo';

export interface ResearchDataRepositoryPort {
  findByProjectId(projectId: string): Promise<ResultEx<StoredResearchData | null, Error>>;
  save(data: StoredResearchData): Promise<ResultEx<void, Error>>;
  /** Update only research_status and research_status_updated_at. */
  updateResearchStatus(projectId: string, status: ResearchStatus): Promise<ResultEx<void, Error>>;
}
