import { injectable, inject } from 'inversify';
import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import type {
  WebScraperPort,
  ScraperParseConfig,
  ScraperParseResult,
} from '../../application/ports/web-scraper.port';
import type { FetchHtmlPort } from '../../application/ports/fetch-html.port';
import type { ScraperSourceType } from '../../domain/value-objects/scraper-source-type.vo';
import { TYPES as SCRAPER_TYPES } from '../bootstrap/types';

const NOISE_PLAN_TITLES = new Set([
  'pricing',
  'afghanistan', 'albania', 'algeria', 'andorra', 'argentina', 'armenia', 'australia', 'austria',
  'bahrain', 'belarus', 'belgium', 'brazil', 'bulgaria', 'canada', 'chile', 'china', 'colombia',
  'croatia', 'cyprus', 'czech republic', 'denmark', 'egypt', 'estonia', 'finland', 'france',
  'germany', 'greece', 'hungary', 'india', 'indonesia', 'iran', 'iraq', 'ireland', 'israel', 'italy',
  'japan', 'jordan', 'kazakhstan', 'kenya', 'korea', 'kuwait', 'latvia', 'lebanon', 'libya',
  'lithuania', 'luxembourg', 'malaysia', 'malta', 'mexico', 'monaco', 'morocco', 'netherlands',
  'new zealand', 'nigeria', 'norway', 'oman', 'pakistan', 'peru', 'philippines', 'poland',
  'portugal', 'qatar', 'romania', 'russia', 'saudi arabia', 'serbia', 'singapore', 'slovakia',
  'slovenia', 'south africa', 'spain', 'sudan', 'sweden', 'switzerland', 'syria', 'taiwan',
  'thailand', 'tunisia', 'turkey', 'ukraine', 'uae', 'united arab emirates', 'united kingdom',
  'united states', 'usa', 'uk', 'venezuela', 'vietnam', 'yemen',
]);

@injectable()
export class WebScraperRealAdapter implements WebScraperPort {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(SCRAPER_TYPES.FetchHtml)
    private readonly _fetchHtml: FetchHtmlPort
  ) {}

  async parse(config: ScraperParseConfig): Promise<ResultEx<ScraperParseResult, Error>> {
    this._logger.info('web-scraper-real.parse', { url: config.url, type: config.type });

    try {
      const html = await this._fetchHtml.getHtml(config.url);
      const $ = cheerio.load(html);

      if (config.customSelectors?.selectors && Object.keys(config.customSelectors.selectors).length > 0) {
        const data = this.extractWithCustomSelectors($, config);
        return ResultEx.success({
          url: config.url,
          data,
          items: data.items as unknown[] | undefined,
        });
      }

      const data = this.extractByType($, config);
      return ResultEx.success({
        url: config.url,
        data,
        items: data.items as unknown[] | undefined,
      });
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      this._logger.warn('web-scraper-real.parse.failed', { url: config.url, error: err.message });
      return ResultEx.failure(err);
    }
  }

  private extractWithCustomSelectors(
    $: cheerio.CheerioAPI,
    config: ScraperParseConfig
  ): Record<string, unknown> {
    const { selectors } = config.customSelectors!;
    const containerSelector = selectors['container'] ?? selectors['item'] ?? null;
    const fieldKeys = Object.keys(selectors).filter((k) => k !== 'container' && k !== 'item');

    const items: Record<string, unknown>[] = [];

    if (containerSelector && typeof containerSelector === 'string') {
      $(containerSelector).each((_: number, el: AnyNode) => {
        const item: Record<string, unknown> = {};
        for (const key of fieldKeys) {
          const sel = selectors[key];
          if (typeof sel !== 'string') continue;
          const text = $(el).find(sel).first().text().trim();
          if (text) item[key] = text;
        }
        if (Object.keys(item).length > 0) items.push(item);
      });
    } else {
      const item: Record<string, unknown> = {};
      for (const key of fieldKeys) {
        const sel = selectors[key];
        if (typeof sel !== 'string') continue;
        const text = $(sel).first().text().trim();
        if (text) item[key] = text;
      }
      if (Object.keys(item).length > 0) items.push(item);
    }

    return {
      source: config.url,
      type: config.type,
      collected: config.whatToCollect,
      items,
      scrapedAt: new Date().toISOString(),
    };
  }

  private extractByType($: cheerio.CheerioAPI, config: ScraperParseConfig): Record<string, unknown> {
    const type = config.type as ScraperSourceType;
    switch (type) {
      case 'competitor_sites':
        return this.extractCompetitorSites($, config);
      case 'user_reviews':
        return this.extractUserReviews($, config);
      case 'job_market':
        return this.extractJobMarket($, config);
      case 'news_articles':
        return this.extractNewsArticles($, config);
      case 'custom':
        return {
          source: config.url,
          type: 'custom',
          selectors: config.customSelectors ?? undefined,
          items: [],
          scrapedAt: new Date().toISOString(),
        };
      default: {
        const _exhaustive: never = type;
        throw new Error(`Unsupported scraper type: ${String(_exhaustive)}`);
      }
    }
  }

  /** Normalize whitespace and strip common UI/icon labels from scraped text */
  private cleanSnippet(raw: string, maxLen: number = 300): string {
    let s = raw
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\bchevron-[^\s]+\s*icon\b/gi, '')
      .replace(/\bicon\s*$/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    return s.slice(0, maxLen) || '';
  }

  /** Get text from element with spaces between block-level content (reduces "Free$0per" glue) */
  private getTextWithSpaces($: cheerio.CheerioAPI, el: AnyNode): string {
    const $el = $(el);
    const parts: string[] = [];
    $el.find('p, li, h1, h2, h3, h4, [class*="description"], [class*="snippet"], [class*="feature"]').each((_, child) => {
      const t = $(child).text().trim();
      if (t) parts.push(t);
    });
    if (parts.length > 0) return parts.join(' ');
    return $el.text().replace(/\s+/g, ' ').trim();
  }

  private static readonly PRICE_REGEX =
    /\$[\d,]+(?:\.\d{2})?|€[\d,]+(?:\.\d{2})?|[\d,]+(?:\.\d{2})?\s*(?:USD|EUR|₽|руб)/gi;

  /** Also match price-like numbers in "10 / month", "15 per user" context (no currency symbol in HTML). */
  private static readonly PRICE_LIKE_REGEX =
    /\b(\d{1,4}(?:\.\d{2})?)\s*(?:\/|per)\s*(?:month|user|year|seat|member|mo\b)/gi;
  /** Match "13.33 monthly", "20 yearly" (no slash). */
  private static readonly PRICE_MONTHLY_YEARLY_REGEX =
    /\b(\d{1,4}(?:\.\d{2})?)\s*(?:monthly|yearly)/gi;
  /** Match "99 lifetime", "99 one-time" (e.g. AnswerThePublic). */
  private static readonly PRICE_LIFETIME_REGEX =
    /\b(\d{1,4}(?:\.\d{2})?)\s*(?:lifetime|one-time|one time)/gi;

  private findPricingBlocks($: cheerio.CheerioAPI): AnyNode[] {
    const selector =
      '[class*="pricing"], [class*="plan"], [class*="tier"], [class*="offer"], [class*="package"], [class*="price"], [class*="card"], [data-testid*="pricing"], [data-testid*="plan"]';
    return $(selector).toArray() as AnyNode[];
  }

  /** Get text from body and main content areas for price extraction (SPA / minimal body). */
  private getBodyTextForPrices($: cheerio.CheerioAPI): string {
    const bodyText = $('body').text();
    const mainSelectors = ['main', 'section', '[role="main"]', '#content', '.content', '#app', '#root'];
    const mainText = mainSelectors.map((sel) => $(sel).first().text()).join(' ');
    return (bodyText + ' ' + mainText).replace(/\s+/g, ' ').trim();
  }

  private extractPricesFromText(text: string): string[] {
    const seen = new Set<string>();
    const prices: string[] = [];

    const re = new RegExp(WebScraperRealAdapter.PRICE_REGEX.source, 'gi');
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const p = m[0].trim();
      if (p && !seen.has(p)) {
        seen.add(p);
        prices.push(p);
      }
    }

    const re2 = new RegExp(WebScraperRealAdapter.PRICE_LIKE_REGEX.source, 'gi');
    while ((m = re2.exec(text)) !== null) {
      const num = m[1];
      const normalized = `$${num}`;
      if (!seen.has(normalized)) {
        seen.add(normalized);
        prices.push(normalized);
      }
    }

    const re3 = new RegExp(WebScraperRealAdapter.PRICE_MONTHLY_YEARLY_REGEX.source, 'gi');
    while ((m = re3.exec(text)) !== null) {
      const num = m[1];
      const normalized = `$${num}`;
      if (!seen.has(normalized)) {
        seen.add(normalized);
        prices.push(normalized);
      }
    }

    const re4 = new RegExp(WebScraperRealAdapter.PRICE_LIFETIME_REGEX.source, 'gi');
    while ((m = re4.exec(text)) !== null) {
      const num = m[1];
      const normalized = `$${num}`;
      if (!seen.has(normalized)) {
        seen.add(normalized);
        prices.push(normalized);
      }
    }

    return prices;
  }

  private parsePriceNumeric(price: string): number {
    const cleaned = price.replace(/,/g, '').replace(/[^0-9.]/g, '');
    return parseFloat(cleaned) || 0;
  }

  private inferPriceTier(bestPrice: string, mainPrices: number[]): string {
    const numeric = this.parsePriceNumeric(bestPrice);
    if (numeric === 0) return 'free';
    const idx = mainPrices.indexOf(numeric);
    if (idx < 0) return 'other';
    if (idx === 0) return 'tier1';
    if (idx === 1) return 'tier2';
    if (idx === 2) return 'tier3';
    return `tier${idx + 1}`;
  }

  private extractBlockTitle($: cheerio.CheerioAPI, block: AnyNode): string {
    return $(block).find('h1, h2, h3, h4, [class*="title"], [class*="name"]').first().text().trim();
  }

  /** Exclude nav/footer/dropdown titles that are not pricing plan names. */
  private isNoisePlanTitle(plan: string): boolean {
    const t = plan.trim().toLowerCase();
    if (!t) return true;
    if (t === 'pricing') return true;
    if (NOISE_PLAN_TITLES.has(t)) return true;
    if (t.length > 60) return true;
    return false;
  }

  private extractCompetitorSites(
    $: cheerio.CheerioAPI,
    config: ScraperParseConfig
  ): Record<string, unknown> {
    let blocks = this.findPricingBlocks($);

    if (blocks.length === 0) {
      const bodyText = this.getBodyTextForPrices($);
      let prices = this.extractPricesFromText(bodyText);
      if (prices.length === 0) {
        const altText = $('main').text() + ' ' + $('section').text() + ' ' + $('article').text();
        if (altText.trim().length > 20) prices = this.extractPricesFromText(altText.replace(/\s+/g, ' ').trim());
      }
      if (prices.length > 0) {
        const priceGroups = new Map<number, string[]>();
        prices.forEach((price) => {
          const numeric = this.parsePriceNumeric(price);
          if (!priceGroups.has(numeric)) priceGroups.set(numeric, []);
          if (!priceGroups.get(numeric)!.includes(price)) priceGroups.get(numeric)!.push(price);
        });
        const validPriceValues = Array.from(priceGroups.keys())
          .filter((v) => v >= 0 && v < 10000)
          .sort((a, b) => a - b);
        const mainPrices = validPriceValues.length > 0 ? validPriceValues : [0];
        const items: Record<string, unknown>[] = validPriceValues.slice(0, 20).map((numeric) => {
          const priceStr = priceGroups.get(numeric)![0];
          return {
            plan: undefined,
            price: priceStr,
            priceTier: this.inferPriceTier(priceStr, mainPrices),
            snippet: undefined,
          };
        });
        return {
          source: config.url,
          type: 'competitor_sites',
          collected: config.whatToCollect,
          items,
          scrapedAt: new Date().toISOString(),
        };
      }
    }

    const allPricesInPage: Array<{ price: string; blockIndex: number }> = [];

    blocks.forEach((block, blockIndex) => {
      const blockText = $(block).text();
      const prices = this.extractPricesFromText(blockText);
      prices.forEach((price) => allPricesInPage.push({ price, blockIndex }));
    });

    const priceGroups = new Map<number, string[]>();
    allPricesInPage.forEach(({ price }) => {
      const numeric = this.parsePriceNumeric(price);
      if (!priceGroups.has(numeric)) priceGroups.set(numeric, []);
      if (!priceGroups.get(numeric)!.includes(price)) priceGroups.get(numeric)!.push(price);
    });

    const validPriceValues = Array.from(priceGroups.keys())
      .filter((v) => v > 0 && v < 10000)
      .sort((a, b) => a - b);
    const mainPrices = validPriceValues.length > 0 ? validPriceValues : [0];

    const items: Record<string, unknown>[] = [];
    for (let blockIndex = 0; blockIndex < blocks.length; blockIndex++) {
      const block = blocks[blockIndex];
      const $block = $(block);
      const blockText = $block.text();
      const blockPrices = this.extractPricesFromText(blockText);
      if (blockPrices.length === 0) continue;

      let bestPrice = blockPrices[0];
      if (blockPrices.length > 1) {
        const matchingMainPrices = blockPrices.filter((p) => {
          const numeric = this.parsePriceNumeric(p);
          return mainPrices.includes(numeric);
        });
        if (matchingMainPrices.length > 0) {
          bestPrice = matchingMainPrices[0];
        }
      }

      const plan = this.extractBlockTitle($, block);
      if (this.isNoisePlanTitle(plan)) continue;
      const textForSnippet = this.getTextWithSpaces($, block as AnyNode) || blockText.replace(/\s+/g, ' ').trim();
      const snippet = this.cleanSnippet(textForSnippet, 250);

      const item: Record<string, unknown> = {
        plan: plan || undefined,
        price: bestPrice,
        prices: blockPrices.length > 1 ? blockPrices : undefined,
        priceTier: this.inferPriceTier(bestPrice ?? '', mainPrices),
      };
      if (snippet) item.snippet = snippet;
      items.push(item);
    }

    if (items.length === 0) {
      const bodyText = this.getBodyTextForPrices($);
      let bodyPrices = this.extractPricesFromText(bodyText);
      if (bodyPrices.length === 0) {
        const altText = $('main').text() + ' ' + $('section').text() + ' ' + $('article').text();
        if (altText.trim().length > 20) bodyPrices = this.extractPricesFromText(altText.replace(/\s+/g, ' ').trim());
      }
      if (bodyPrices.length > 0) {
        const priceGroups = new Map<number, string[]>();
        bodyPrices.forEach((price) => {
          const numeric = this.parsePriceNumeric(price);
          if (!priceGroups.has(numeric)) priceGroups.set(numeric, []);
          if (!priceGroups.get(numeric)!.includes(price)) priceGroups.get(numeric)!.push(price);
        });
        const validPriceValues = Array.from(priceGroups.keys())
          .filter((v) => v >= 0 && v < 10000)
          .sort((a, b) => a - b);
        const mainPrices = validPriceValues.length > 0 ? validPriceValues : [0];
        const fallbackItems: Record<string, unknown>[] = validPriceValues.slice(0, 20).map((numeric) => {
          const priceStr = priceGroups.get(numeric)![0];
          return {
            plan: undefined,
            price: priceStr,
            priceTier: this.inferPriceTier(priceStr, mainPrices),
            snippet: undefined,
          };
        });
        return {
          source: config.url,
          type: 'competitor_sites',
          collected: config.whatToCollect,
          items: fallbackItems,
          scrapedAt: new Date().toISOString(),
        };
      }
    }

    const filtered = items.filter((it) => {
      const plan = (it.plan as string) ?? '';
      const price = it.price as string | undefined;
      const snippet = (it.snippet as string) ?? '';
      const hasPlan = plan.trim().length > 0;
      const hasPrice = price != null && String(price).trim().length > 0;
      const priceNum = this.parsePriceNumeric(price ?? '');
      if (hasPlan || hasPrice) return true;
      if (snippet.length >= 40) return true;
      return false;
    });

    const planKey = (it: Record<string, unknown>): string => {
      const p = ((it.plan as string) ?? (it.priceTier as string) ?? '').trim().toLowerCase().slice(0, 60);
      return p || `price_${this.parsePriceNumeric((it.price as string) ?? '')}`;
    };
    const byPlan = new Map<string, Record<string, unknown>>();
    for (const it of filtered) {
      const key = planKey(it);
      const existing = byPlan.get(key);
      if (!existing) {
        byPlan.set(key, it);
        continue;
      }
      const existingNum = this.parsePriceNumeric((existing.price as string) ?? '');
      const currentNum = this.parsePriceNumeric((it.price as string) ?? '');
      if (currentNum > 0 && existingNum === 0) byPlan.set(key, it);
      else if (currentNum > 0 && currentNum < existingNum) byPlan.set(key, it);
    }

    const paidFirst = Array.from(byPlan.values()).sort((a, b) => {
      const an = this.parsePriceNumeric((a.price as string) ?? '');
      const bn = this.parsePriceNumeric((b.price as string) ?? '');
      if (an > 0 && bn === 0) return -1;
      if (an === 0 && bn > 0) return 1;
      return an - bn;
    });
    const capped = paidFirst.slice(0, 20);

    return {
      source: config.url,
      type: 'competitor_sites',
      collected: config.whatToCollect,
      items: capped,
      scrapedAt: new Date().toISOString(),
    };
  }

  private extractUserReviews($: cheerio.CheerioAPI, config: ScraperParseConfig): Record<string, unknown> {
    const items: Record<string, unknown>[] = [];
    $('[class*="review"], [class*="rating"], [data-testid*="review"], article').each((_: number, el: AnyNode) => {
      const $el = $(el);
      const text = $el.text().trim();
      const ratingEl = $el.find('[class*="rating"], [class*="star"], [aria-label*="rating"]').first();
      const ratingText = ratingEl.text().trim() || ratingEl.attr('aria-label') || '';
      const ratingMatch = ratingText.match(/(\d(?:\.\d)?)\s*(?:out of|\/)/i) || ratingText.match(/(\d)/);
      const rating = ratingMatch ? Number(ratingMatch[1]) : undefined;
      if (text.length > 20) {
        items.push({
          rating,
          text: text.slice(0, 500),
          date: $el.find('[datetime]').attr('datetime') || undefined,
        });
      }
    });
    if (items.length === 0) {
      const bodyText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 500);
      items.push({ excerpt: bodyText });
    }
    return {
      source: config.url,
      type: 'user_reviews',
      collected: config.whatToCollect,
      items,
      scrapedAt: new Date().toISOString(),
    };
  }

  private extractJobMarket($: cheerio.CheerioAPI, config: ScraperParseConfig): Record<string, unknown> {
    const items: Record<string, unknown>[] = [];
    $('[class*="job"], [class*="vacancy"], [data-testid*="job"], article').each((_, el) => {
      const $el = $(el);
      const title = $el.find('h1, h2, h3, [class*="title"]').first().text().trim();
      const text = $el.text().trim();
      if (title || text.length > 30) {
        items.push({
          title: title || undefined,
          snippet: text.slice(0, 200).trim() || undefined,
        });
      }
    });
    if (items.length === 0) {
      const bodyText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 500);
      items.push({ excerpt: bodyText });
    }
    return {
      source: config.url,
      type: 'job_market',
      collected: config.whatToCollect,
      items,
      scrapedAt: new Date().toISOString(),
    };
  }

  private extractNewsArticles($: cheerio.CheerioAPI, config: ScraperParseConfig): Record<string, unknown> {
    const items: Record<string, unknown>[] = [];
    $('article, [class*="article"], [class*="post"]').each((_: number, el: AnyNode) => {
      const $el = $(el);
      const title = $el.find('h1, h2, h3, [class*="title"]').first().text().trim();
      const excerpt = $el.find('[class*="excerpt"], [class*="summary"], p').first().text().trim();
      const text = $el.text().trim();
      if (title || text.length > 20) {
        items.push({
          title: title || undefined,
          excerpt: excerpt || text.slice(0, 200) || undefined,
          url: config.url,
        });
      }
    });
    if (items.length === 0) {
      const title = $('title').text().trim();
      const bodyText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 500);
      items.push({ title: title || undefined, excerpt: bodyText, url: config.url });
    }
    return {
      source: config.url,
      type: 'news_articles',
      collected: config.whatToCollect,
      items,
      scrapedAt: new Date().toISOString(),
    };
  }
}
