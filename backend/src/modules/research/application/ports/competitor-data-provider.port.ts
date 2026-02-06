import ResultEx from '../../../../infrastructure/result/result';
import type { CompetitorInfoBlock } from '../../domain/entities/competitor-info-block.entity';
import type { ResearchIntent } from '../use-cases/input-output/collect-research-data.io';

export interface CompetitorDataProviderPort {
  fetchCompetitorData(projectId: string, intent: ResearchIntent): Promise<ResultEx<CompetitorInfoBlock | null, Error>>;
}
