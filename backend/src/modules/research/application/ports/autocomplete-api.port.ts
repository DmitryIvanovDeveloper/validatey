export interface AutocompleteApiPort {
  /** Fetch autocomplete suggestions for a given input phrase. Returns array of suggestion strings. */
  fetchSuggestions(input: string): Promise<string[]>;
}
