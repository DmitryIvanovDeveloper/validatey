export type ScraperSourceType =
  | 'competitor_sites'
  | 'user_reviews'
  | 'job_market'
  | 'news_articles'
  | 'custom';

export const SCRAPER_SOURCE_TYPES: ScraperSourceType[] = [
  'competitor_sites',
  'user_reviews',
  'job_market',
  'news_articles',
  'custom',
];

export function isScraperSourceType(value: string): value is ScraperSourceType {
  return SCRAPER_SOURCE_TYPES.includes(value as ScraperSourceType);
}
