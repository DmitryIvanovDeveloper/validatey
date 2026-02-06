import { injectable } from 'inversify';
import ResultEx from '../../../../infrastructure/result/result';
import type { MarketDataProviderPort } from '../../application/ports/market-data-provider.port';
import type { MarketDataBlock } from '../../domain/value-objects/market-data-block.vo';
import type { ResearchIntent } from '../../application/use-cases/input-output/collect-research-data.io';

/** Stub: returns null until real integration (e.g. SimilarWeb, Statista) is added. */
@injectable()
export class MarketDataProviderStubAdapter implements MarketDataProviderPort {
  async fetchMarketData(
    _projectId: string,
    _intent: ResearchIntent
  ): Promise<ResultEx<MarketDataBlock | null, Error>> {
    return ResultEx.success(null);
  }
}
