import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import type { WebScraperPort, ScraperParseConfig, ScraperParseResult } from '../../application/ports/web-scraper.port';

/**
 * Stub adapter: returns mock structured data per URL/type without fetching.
 * Replace with real implementation (e.g. Cheerio/Puppeteer + proxy) for production.
 */
@injectable()
export class WebScraperStubAdapter implements WebScraperPort {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}

  async parse(config: ScraperParseConfig): Promise<ResultEx<ScraperParseResult, Error>> {
    this._logger.info('web-scraper-stub.parse', { url: config.url, type: config.type });

    try {
      const data = this.buildMockData(config);
      return ResultEx.success({
        url: config.url,
        data,
        items: data.items as unknown[] | undefined,
      });
    } catch (e) {
      return ResultEx.failure(e instanceof Error ? e : new Error(String(e)));
    }
  }

  private buildMockData(config: ScraperParseConfig): Record<string, unknown> {
    switch (config.type) {
      case 'competitor_sites':
        return {
          source: config.url,
          type: 'competitor_sites',
          collected: config.whatToCollect,
          items: [
            { plan: 'Basic', price: '$49', features: ['Feature A', 'Feature B'] },
            { plan: 'Pro', price: '$199', features: ['Feature A', 'B', 'C'] },
            { plan: 'Enterprise', price: '$599', features: ['All'] },
          ],
          scrapedAt: new Date().toISOString(),
        };
      case 'user_reviews':
        return {
          source: config.url,
          type: 'user_reviews',
          collected: config.whatToCollect,
          items: [
            { rating: 5, text: 'Great product', date: '2025-01-01' },
            { rating: 4, text: 'Good but expensive', date: '2025-01-02' },
          ],
          scrapedAt: new Date().toISOString(),
        };
      case 'job_market':
        return {
          source: config.url,
          type: 'job_market',
          collected: config.whatToCollect,
          items: [
            { title: 'Product Manager', company: 'Company A', location: 'Remote' },
            { title: 'PM', company: 'Company B', location: 'NYC' },
          ],
          scrapedAt: new Date().toISOString(),
        };
      case 'news_articles':
        return {
          source: config.url,
          type: 'news_articles',
          collected: config.whatToCollect,
          items: [
            { title: 'Trend 2025', excerpt: 'Summary...', url: config.url, date: '2025-01-01' },
          ],
          scrapedAt: new Date().toISOString(),
        };
      case 'custom':
        return {
          source: config.url,
          type: 'custom',
          selectors: config.customSelectors ?? undefined,
          items: [],
          scrapedAt: new Date().toISOString(),
        };
      default: {
        const _exhaustive: never = config.type;
        throw new Error(`Unsupported scraper type: ${String(_exhaustive)}`);
      }
    }
  }
}
