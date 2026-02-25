import type ResultEx from '../../../../infrastructure/result/result';
import type { AcademicPapersBlock } from '../../domain/value-objects/academic-papers-block.vo';
import type { ResearchIntent } from '../use-cases/input-output/collect-research-data.io';

export interface AcademicPapersProviderPort {
  fetchAcademicPapers(
    projectId: string,
    intent: ResearchIntent
  ): Promise<ResultEx<AcademicPapersBlock | null, Error>>;
}
