import ResultEx from '../../../../infrastructure/result/result';
import type { ResearchIntent } from '../use-cases/input-output/collect-research-data.io';

export interface SearchPhrasesGeneratorPort {
  generatePhrases(intent: ResearchIntent): Promise<ResultEx<string[], Error>>;
}
