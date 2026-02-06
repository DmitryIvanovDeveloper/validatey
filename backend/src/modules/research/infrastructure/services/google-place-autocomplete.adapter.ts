import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import type { AutocompleteApiPort } from '../../application/ports/autocomplete-api.port';

const PLACES_AUTOCOMPLETE_URL = 'https://places.googleapis.com/v1/places:autocomplete';
const MAX_SUGGESTIONS_PER_PHRASE = 5;

interface PlaceAutocompleteResponse {
  suggestions?: Array<{
    placePrediction?: { text?: { text?: string }; structuredFormat?: { mainText?: { text?: string }; secondaryText?: { text?: string } } };
    queryPrediction?: { text?: { text?: string } };
  }>;
}

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

    const apiKey = process.env.GOOGLE_PLACES_API_KEY?.trim();
    if (!apiKey) {
      return [];
    }

    try {
      const response = await this._http.post<PlaceAutocompleteResponse>(
        PLACES_AUTOCOMPLETE_URL,
        { input: trimmed },
        {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
        }
      );

      const suggestions = response?.suggestions ?? [];
      const texts: string[] = [];

      for (const s of suggestions) {
        if (s.queryPrediction?.text?.text) {
          const t = s.queryPrediction.text.text.trim();
          if (t && !texts.includes(t)) {
            texts.push(t);
            if (texts.length >= MAX_SUGGESTIONS_PER_PHRASE) break;
          }
        }
        if (s.placePrediction?.text?.text) {
          const t = s.placePrediction.text.text.trim();
          if (t && !texts.includes(t)) {
            texts.push(t);
            if (texts.length >= MAX_SUGGESTIONS_PER_PHRASE) break;
          }
        }
      }

      if (texts.length === 0 && suggestions.length > 0) {
        this._logger.warn('google-place-autocomplete.unexpected-structure', {
          input: trimmed,
          responseKeys: Object.keys(response ?? {}),
          firstSuggestionKeys: suggestions[0] ? Object.keys(suggestions[0]) : [],
        });
      }
      return texts;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this._logger.warn('google-place-autocomplete.error', { input: trimmed, error: msg });
      return [];
    }
  }
}
