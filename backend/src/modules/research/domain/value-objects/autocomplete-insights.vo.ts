/** Autocomplete insights: generated search phrases + Google Autocomplete results. */
export interface AutocompleteInsights {
	readonly searchPhrases: readonly string[];
	readonly results: ReadonlyArray<{
		readonly phrase: string;
		readonly suggestions: readonly string[];
	}>;
}
