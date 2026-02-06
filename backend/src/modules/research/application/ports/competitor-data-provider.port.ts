import ResultEx from '../../../../infrastructure/result/result';
import type { CompetitorInfoBlock } from '../../domain/value-objects/competitor-info-block.vo';
import type { ResearchIntent } from '../use-cases/input-output/collect-research-data.io';

export interface CompetitorDataProviderPort {
  fetchCompetitorData(projectId: string, intent: ResearchIntent): Promise<ResultEx<CompetitorInfoBlock | null, Error>>;
}
