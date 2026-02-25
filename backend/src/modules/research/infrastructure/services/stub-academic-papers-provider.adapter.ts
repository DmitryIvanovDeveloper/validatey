import { injectable } from 'inversify';
import ResultEx from '../../../../infrastructure/result/result';
import type { AcademicPapersProviderPort } from '../../application/ports/academic-papers-provider.port';
import type { AcademicPapersBlock } from '../../domain/value-objects/academic-papers-block.vo';
import type { ResearchIntent } from '../../application/use-cases/input-output/collect-research-data.io';

/** Stub: returns null until the real Semantic Scholar integration is enabled. */
@injectable()
export class StubAcademicPapersProviderAdapter implements AcademicPapersProviderPort {
  async fetchAcademicPapers(
    _projectId: string,
    _intent: ResearchIntent
  ): Promise<ResultEx<AcademicPapersBlock | null, Error>> {
    return ResultEx.success(null);
  }
}
