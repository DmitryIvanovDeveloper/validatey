import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import type { AutocompleteApiPort } from '../../application/ports/autocomplete-api.port';

/**
 * Uses Google Search Autocomplete (suggestqueries) — returns real search query suggestions,
 * not physical places. No API key required.
 * Response format: ["query", ["suggestion1", "suggestion2", ...], ...]
 */
const SEARCH_AUTOCOMPLETE_BASE_URL = 'https://suggestqueries.google.com/complete/search';
const MAX_SUGGESTIONS_PER_PHRASE = 5;

@injectable()
export class GooglePlaceAutocompleteAdapter implements AutocompleteApiPort {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(ROOT_TYPES.HttpClient)
    private readonly _http: HttpClientPort
  ) {}

  async fetchSuggestions(input: string): Promise<string[]> {
    const trimmed = (input ?? '').trim().slice(0, 100);
    if (!trimmed) return [];

    try {
      const encoded = encodeURIComponent(trimmed);
      const url = `${SEARCH_AUTOCOMPLETE_BASE_URL}?client=firefox&output=json&hl=en&q=${encoded}`;

      // Response is a JSON array: ["query", ["sug1", "sug2", ...], [], {...}]
      const response = await this._http.get<unknown[]>(url, {
        'User-Agent': 'Mozilla/5.0 (compatible; Validatey/1.0)',
      });

      const suggestionsArray = Array.isArray(response) && Array.isArray(response[1]) ? response[1] : [];
      const texts: string[] = [];

      for (const s of suggestionsArray) {
        if (typeof s === 'string' && s.trim()) {
          const t = s.trim();
          if (!texts.includes(t)) {
            texts.push(t);
            if (texts.length >= MAX_SUGGESTIONS_PER_PHRASE) break;
          }
        }
      }

      this._logger.info('google-search-autocomplete.done', { input: trimmed, count: texts.length });
      return texts;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this._logger.warn('google-search-autocomplete.error', { input: trimmed, error: msg });
      return [];
    }
  }
}
