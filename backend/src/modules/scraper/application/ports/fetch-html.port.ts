/**
 * Port for fetching raw HTML by URL.
 * Implemented in infrastructure (e.g. HTTP with User-Agent).
 */
export interface FetchHtmlPort {
  getHtml(url: string): Promise<string>;
}
