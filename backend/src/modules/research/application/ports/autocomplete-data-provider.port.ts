import ResultEx from '../../../../infrastructure/result/result';
import type { AutocompleteInsights } from '../../domain/value-objects/autocomplete-insights.vo';
import type { ResearchIntent } from '../use-cases/input-output/collect-research-data.io';

export interface AutocompleteDataProviderPort {
  fetchAutocompleteData(projectId: string, intent: ResearchIntent): Promise<ResultEx<AutocompleteInsights | null, Error>>;
}
