import ResultEx from '../../../../infrastructure/result/result';
import type { MarketDataBlock } from '../../domain/value-objects/market-data-block.vo';
import type { ResearchIntent } from '../use-cases/input-output/collect-research-data.io';

export interface MarketDataProviderPort {
  fetchMarketData(projectId: string, intent: ResearchIntent): Promise<ResultEx<MarketDataBlock | null, Error>>;
}
