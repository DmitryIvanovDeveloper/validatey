import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import ResultEx from '../../../../infrastructure/result/result';
import { SearchServicePort, SearchResult } from '../../application/ports/search-service.port';
import { AiModuleError } from '../../domain/errors/ai.error';

const SERPER_URL = 'https://google.serper.dev/search';

interface SerperOrganicItem {
  title?: string;
  link?: string;
  snippet?: string;
}

interface SerperResponse {
  organic?: SerperOrganicItem[];
}

@injectable()
export class SerperSearchService implements SearchServicePort {
  constructor(
    @inject(ROOT_TYPES.HttpClient)
    private readonly _http: HttpClientPort
  ) {}

  async search(query: string): Promise<ResultEx<SearchResult[], AiModuleError>> {
    const apiKey = process.env.SERPER_API_KEY;
    if (!apiKey || !apiKey.trim()) {
      return ResultEx.failure(new AiModuleError('Search not configured: SERPER_API_KEY is missing'));
    }

    try {
      const response = await this._http.post<SerperResponse>(
        SERPER_URL,
        { q: query, num: 10 },
        {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey.trim(),
        }
      );

      const organic = response?.organic ?? [];
      const results: SearchResult[] = organic
        .filter((item) => (item.snippet ?? item.title ?? '').trim())
        .map((item) => ({
          title: (item.title ?? '').trim(),
          snippet: (item.snippet ?? '').trim(),
          url: (item.link ?? '').trim(),
        }));

      return ResultEx.success(results);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return ResultEx.failure(new AiModuleError(`Search failed: ${message}`));
    }
  }
}
