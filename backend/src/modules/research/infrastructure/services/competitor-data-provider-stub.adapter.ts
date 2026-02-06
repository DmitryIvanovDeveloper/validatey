import { injectable } from 'inversify';
import ResultEx from '../../../../infrastructure/result/result';
import type { CompetitorDataProviderPort } from '../../application/ports/competitor-data-provider.port';
import type { CompetitorInfoBlock } from '../../domain/value-objects/competitor-info-block.vo';
import type { ResearchIntent } from '../../application/use-cases/input-output/collect-research-data.io';

/** Stub: returns null until real integration (e.g. Crunchbase, App Store) is added. */
@injectable()
export class CompetitorDataProviderStubAdapter implements CompetitorDataProviderPort {
  async fetchCompetitorData(
    _projectId: string,
    _intent: ResearchIntent
  ): Promise<ResultEx<CompetitorInfoBlock | null, Error>> {
    return ResultEx.success(null);
  }
}
