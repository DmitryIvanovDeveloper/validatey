import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { TYPES as RESEARCH_TYPES } from '../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import type { SearchPhrasesGeneratorPort } from '../../application/ports/search-phrases-generator.port';
import type { AutocompleteApiPort } from '../../application/ports/autocomplete-api.port';
import type { AutocompleteDataProviderPort } from '../../application/ports/autocomplete-data-provider.port';
import type { ResearchIntent } from '../../application/use-cases/input-output/collect-research-data.io';
import type { AutocompleteInsights } from '../../domain/entities/autocomplete-insights.entity';

@injectable()
export class AutocompleteDataProviderAdapter implements AutocompleteDataProviderPort {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(RESEARCH_TYPES.SearchPhrasesGenerator)
    private readonly _phrasesGenerator: SearchPhrasesGeneratorPort,
    @inject(RESEARCH_TYPES.AutocompleteApi)
    private readonly _autocompleteApi: AutocompleteApiPort
  ) {}

  async fetchAutocompleteData(
    projectId: string,
    intent: ResearchIntent
  ): Promise<ResultEx<AutocompleteInsights | null, Error>> {
    const hasApiKey = !!process.env.GOOGLE_PLACES_API_KEY?.trim();
    if (!hasApiKey) {
      this._logger.info('autocomplete-data-provider.skipped', { projectId, reason: 'GOOGLE_PLACES_API_KEY not set' });
      return ResultEx.success(null);
    }

    this._logger.info('autocomplete-data-provider.start', { projectId, topic: intent.topic });

    const phrasesResult = await this._phrasesGenerator.generatePhrases(intent);
    if (!phrasesResult.isSuccess) {
      this._logger.warn('autocomplete-data-provider.phrases-failed', { projectId, error: phrasesResult.error });
      return ResultEx.success(null);
    }

    const phrases = phrasesResult.data.filter((p) => p.trim().length > 0);
    if (phrases.length === 0) {
      return ResultEx.success(null);
    }

    const results: { phrase: string; suggestions: string[] }[] = [];

    for (const phrase of phrases) {
      const suggestions = await this._autocompleteApi.fetchSuggestions(phrase);
      if (suggestions.length > 0) {
        results.push({ phrase, suggestions });
      }
    }

    const insights: AutocompleteInsights = {
      searchPhrases: phrases,
      results,
    };

    this._logger.info('autocomplete-data-provider.done', {
      projectId,
      phrasesCount: phrases.length,
      resultsCount: results.length,
    });

    return ResultEx.success(insights);
  }
}
