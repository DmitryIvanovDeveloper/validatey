import ResultEx from '../../../../infrastructure/result/result';
import { AiModuleError } from '../../domain/errors/ai.error';

export interface SearchResult {
  readonly title: string;
  readonly snippet: string;
  readonly url: string;
}

export interface SearchServicePort {
  search(query: string): Promise<ResultEx<SearchResult[], AiModuleError>>;
}
