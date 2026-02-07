import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebScraperRealAdapter } from './web-scraper-real.adapter';
import { FetchHtmlAdapter } from './fetch-html.adapter';
import { FetchHtmlBrowserAdapter } from './fetch-html-browser.adapter';
import type { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import type { FetchHtmlPort } from '../../application/ports/fetch-html.port';

describe('WebScraperRealAdapter', () => {
  const mockLogger: LoggerPort = {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  };

  let mockGetHtml: ReturnType<typeof vi.fn>;
  let adapter: WebScraperRealAdapter;

  beforeEach(() => {
    mockGetHtml = vi.fn();
    adapter = new WebScraperRealAdapter(mockLogger, { getHtml: mockGetHtml });
  });

  describe('competitor_sites price extraction', () => {
    it('extracts $ and € prices from pricing blocks', async () => {
      const html = `
        <div class="pricing-tier">
          <h3>Free</h3>
          <p>Free $0</p>
        </div>
        <div class="pricing-tier">
          <h3>Pro</h3>
          <p>$10 per month</p>
        </div>
        <div class="pricing-tier">
          <h3>Team</h3>
          <p>€15/month</p>
        </div>
      `;
      mockGetHtml.mockResolvedValue(html);

      const result = await adapter.parse({
        url: 'https://example.com/pricing',
        type: 'competitor_sites',
        whatToCollect: ['plans', 'prices'],
        customSelectors: null,
      });

      expect(result.isSuccess).toBe(true);
      if (!result.isSuccess) return;
      const data = result.data.data as { items?: Array<{ plan?: string; price?: string; priceTier?: string }> };
      const items = data.items ?? [];
      expect(items.length).toBe(3);

      const free = items.find((i) => (i.plan ?? '').toLowerCase().includes('free'));
      const pro = items.find((i) => (i.plan ?? '').toLowerCase().includes('pro'));
      const team = items.find((i) => (i.plan ?? '').toLowerCase().includes('team'));

      expect(free?.price).toBe('$0');
      expect(free?.priceTier).toBe('free');
      expect(pro?.price).toBe('$10');
      expect(pro?.priceTier).toBe('tier1');
      expect(team?.price).toMatch(/€15|15/);
      expect(team?.priceTier).toBe('tier2');
    });

    it('extracts price-like "X / month" and "X per user" when no currency symbol (PRICE_LIKE_REGEX)', async () => {
      const html = `
        <div class="pricing-plan">
          <h2>Starter</h2>
          <p>10 / month — get started</p>
        </div>
        <div class="pricing-plan">
          <h2>Pro</h2>
          <p>15 per user per month</p>
        </div>
        <div class="pricing-plan">
          <h2>Enterprise</h2>
          <p>18 per seat / month</p>
        </div>
      `;
      mockGetHtml.mockResolvedValue(html);

      const result = await adapter.parse({
        url: 'https://example.com/plans',
        type: 'competitor_sites',
        whatToCollect: ['plans', 'prices'],
        customSelectors: null,
      });

      expect(result.isSuccess).toBe(true);
      if (!result.isSuccess) return;
      const data = result.data.data as { items?: Array<{ plan?: string; price?: string; priceTier?: string }> };
      const items = data.items ?? [];
      expect(items.length).toBe(3);

      const starter = items.find((i) => (i.plan ?? '').toLowerCase().includes('starter'));
      const pro = items.find((i) => (i.plan ?? '').toLowerCase().includes('pro'));
      const ent = items.find((i) => (i.plan ?? '').toLowerCase().includes('enterprise'));

      expect(starter?.price).toBe('$10');
      expect(starter?.priceTier).toBe('tier1');
      expect(pro?.price).toBe('$15');
      expect(pro?.priceTier).toBe('tier2');
      expect(ent?.price).toBe('$18');
      expect(ent?.priceTier).toBe('tier3');
    });

    it('prefers non-zero mainPrices so block with both $0 and 10 / month gets bestPrice $10', async () => {
      const html = `
        <div class="pricing-tier">
          <h3>Free</h3>
          <p>Free $0 — or 10 / month for add-on</p>
        </div>
        <div class="pricing-tier">
          <h3>Pro</h3>
          <p>15 per user</p>
        </div>
      `;
      mockGetHtml.mockResolvedValue(html);

      const result = await adapter.parse({
        url: 'https://example.com/pricing',
        type: 'competitor_sites',
        whatToCollect: ['plans', 'prices'],
        customSelectors: null,
      });

      expect(result.isSuccess).toBe(true);
      if (!result.isSuccess) return;
      const data = result.data.data as { items?: Array<{ plan?: string; price?: string; priceTier?: string }> };
      const items = data.items ?? [];
      const freeBlock = items.find((i) => (i.plan ?? '').toLowerCase().includes('free'));
      expect(freeBlock?.price).toBe('$10');
      expect(freeBlock?.priceTier).toBe('tier1');
    });
  });

  describe('integration: real Notion pricing page', () => {
    it('extracts valid pricing from https://www.notion.com/pricing', async () => {
      const realFetch: FetchHtmlPort = new FetchHtmlAdapter();
      const adapterReal = new WebScraperRealAdapter(mockLogger, realFetch);

      const result = await adapterReal.parse({
        url: 'https://www.notion.com/pricing',
        type: 'competitor_sites',
        whatToCollect: ['plans', 'prices'],
        customSelectors: null,
      });

      expect(result.isSuccess).toBe(true);
      if (!result.isSuccess) return;

      const data = result.data.data as { items?: Array<{ plan?: string; price?: string; priceTier?: string }> };
      const items = data.items ?? [];
      expect(items.length).toBeGreaterThan(0);
      expect(items.length).toBeLessThanOrEqual(20); // backend filter caps at 20 and dedupes by plan

      const prices = items.map((i) => i.price).filter(Boolean) as string[];
      const hasFree = prices.some((p) => p === '$0' || p === '0');
      const hasPlus = prices.some((p) => p === '$10' || p.includes('10'));
      const hasBusiness = prices.some((p) => p === '$20' || p.includes('20'));

      expect(hasFree, 'expected at least one Free $0').toBe(true);
      expect(hasPlus, 'expected at least one Plus $10').toBe(true);
      expect(hasBusiness, 'expected at least one Business $20').toBe(true);
    }, 35_000);
  });

  it('extracts prices from AnswerThePublic-style HTML (pricing blocks or body fallback)', async () => {
    const html = `
      <div class="pricing-page">
        <div class="pricing-tier">
          <h3>Starter</h3>
          <p>$13.33 / month</p>
          <span>billed yearly</span>
        </div>
        <div class="pricing-tier">
          <h3>Starter monthly</h3>
          <p>$20 per month</p>
        </div>
        <div class="pricing-tier">
          <h3>Lifetime</h3>
          <p>$99 one-time</p>
        </div>
      </div>
    `;
    mockGetHtml.mockResolvedValue(html);

    const result = await adapter.parse({
      url: 'https://answerthepublic.com/pricing',
      type: 'competitor_sites',
      whatToCollect: ['plans', 'prices'],
      customSelectors: null,
    });

    expect(result.isSuccess).toBe(true);
    if (!result.isSuccess) return;
    const data = result.data.data as { items?: Array<{ plan?: string; price?: string }> };
    const items = data.items ?? [];
    expect(items.length).toBeGreaterThan(0);
    const prices = items.map((i) => i.price).filter(Boolean) as string[];
    expect(prices.some((p) => p.includes('13.33') || p === '$13.33')).toBe(true);
    expect(prices.some((p) => p.includes('20') || p.includes('99'))).toBe(true);
  });

  it('extracts "X lifetime" / "X one-time" prices (e.g. AnswerThePublic)', async () => {
    const html = `<body><main><p>Starter $13.33 / month. Lifetime 99 one-time.</p></main></body>`;
    mockGetHtml.mockResolvedValue(html);
    const result = await adapter.parse({
      url: 'https://answerthepublic.com/pricing',
      type: 'competitor_sites',
      whatToCollect: ['prices'],
      customSelectors: null,
    });
    expect(result.isSuccess).toBe(true);
    if (!result.isSuccess) return;
    const data = result.data.data as { items?: Array<{ price?: string }> };
    const prices = (data.items ?? []).map((i) => i.price).filter(Boolean) as string[];
    expect(prices.some((p) => p.includes('99')), `expected $99 from "99 one-time", got: ${JSON.stringify(prices)}`).toBe(true);
  });

  it('returns at least one plan from body-only HTML (no pricing/plan class names)', async () => {
    const html = `
      <!DOCTYPE html><html><body>
        <main>
          <h1>Pricing</h1>
          <p>Starter: $13.33 per month. Pro: $20 monthly. Lifetime: 99 one-time.</p>
        </main>
      </body></html>
    `;
    mockGetHtml.mockResolvedValue(html);
    const result = await adapter.parse({
      url: 'https://answerthepublic.com/pricing',
      type: 'competitor_sites',
      whatToCollect: ['plans', 'prices'],
      customSelectors: null,
    });
    expect(result.isSuccess).toBe(true);
    if (!result.isSuccess) return;
    const data = result.data.data as { items?: Array<{ plan?: string; price?: string }> };
    const items = data.items ?? [];
    expect(items.length, 'body-only page must yield at least one plan (no block selectors)').toBeGreaterThan(0);
    const prices = items.map((i) => i.price).filter(Boolean) as string[];
    expect(prices.length).toBeGreaterThan(0);
  });

  describe('integration: AnswerThePublic pricing page', () => {
    it('loads answerthepublic.com/pricing and extracts pricing when content is available', async () => {
      const browserFetch: FetchHtmlPort = new FetchHtmlBrowserAdapter(mockLogger);
      const adapterReal = new WebScraperRealAdapter(mockLogger, browserFetch);

      const result = await adapterReal.parse({
        url: 'https://answerthepublic.com/pricing',
        type: 'competitor_sites',
        whatToCollect: ['plans', 'prices'],
        customSelectors: null,
      });

      expect(result.isSuccess, result.isSuccess ? '' : String(result.error?.message)).toBe(true);
      if (!result.isSuccess) return;

      const data = result.data.data as { items?: Array<{ plan?: string; price?: string; priceTier?: string }> };
      const items = data.items ?? [];
      expect(items.length, 'answerthepublic.com/pricing must return at least one plan (was: No plans found)').toBeGreaterThan(0);
      expect(items.length).toBeLessThanOrEqual(20);
      const prices = items.map((i) => i.price).filter(Boolean) as string[];
      const hasNumericPrice = prices.some((p) => {
        const n = parseFloat(String(p).replace(/[^0-9.]/g, ''));
        return n >= 10 && n <= 100;
      });
      expect(hasNumericPrice, `expected at least one price in 10–100 range (e.g. $13–99), got: ${JSON.stringify(prices)}`).toBe(true);
    }, 60_000);
  });

  describe('integration: real sites by type', () => {
    const browserFetch: FetchHtmlPort = new FetchHtmlBrowserAdapter(mockLogger);

    it('competitor_sites: stripe.com/pricing returns pricing data or body fallback', async () => {
      const adapterReal = new WebScraperRealAdapter(mockLogger, browserFetch);
      const result = await adapterReal.parse({
        url: 'https://stripe.com/pricing',
        type: 'competitor_sites',
        whatToCollect: ['plans', 'prices'],
        customSelectors: null,
      });
      expect(result.isSuccess, result.isSuccess ? '' : String(result.error?.message)).toBe(true);
      if (!result.isSuccess) return;
      const data = result.data.data as { items?: unknown[] };
      expect(Array.isArray(data.items)).toBe(true);
      expect(data.items!.length).toBeLessThanOrEqual(20);
    }, 60_000);

    it('user_reviews: trustpilot review page returns items or excerpt', async () => {
      const adapterReal = new WebScraperRealAdapter(mockLogger, browserFetch);
      const result = await adapterReal.parse({
        url: 'https://www.trustpilot.com/review/stripe.com',
        type: 'user_reviews',
        whatToCollect: ['ratings', 'reviews'],
        customSelectors: null,
      });
      expect(result.isSuccess, result.isSuccess ? '' : String(result.error?.message)).toBe(true);
      if (!result.isSuccess) return;
      const data = result.data.data as { items?: unknown[] };
      expect(Array.isArray(data.items)).toBe(true);
      if (data.items!.length > 0) {
        const first = data.items![0] as Record<string, unknown>;
        expect(first.rating != null || first.text != null || first.excerpt != null).toBe(true);
      }
    }, 60_000);

    it('job_market: HN jobs or similar returns items or excerpt', async () => {
      const adapterReal = new WebScraperRealAdapter(mockLogger, browserFetch);
      const result = await adapterReal.parse({
        url: 'https://news.ycombinator.com/jobs',
        type: 'job_market',
        whatToCollect: ['titles', 'companies'],
        customSelectors: null,
      });
      expect(result.isSuccess, result.isSuccess ? '' : String(result.error?.message)).toBe(true);
      if (!result.isSuccess) return;
      const data = result.data.data as { items?: unknown[] };
      expect(Array.isArray(data.items)).toBe(true);
      if (data.items!.length > 0) {
        const first = data.items![0] as Record<string, unknown>;
        expect(first.title != null || first.snippet != null || first.excerpt != null).toBe(true);
      }
    }, 60_000);

    it('news_articles: example.com or bbc returns article-like items', async () => {
      const fetchAdapter = new FetchHtmlAdapter();
      const adapterReal = new WebScraperRealAdapter(mockLogger, fetchAdapter);
      const result = await adapterReal.parse({
        url: 'https://example.com',
        type: 'news_articles',
        whatToCollect: ['title', 'excerpt'],
        customSelectors: null,
      });
      expect(result.isSuccess, result.isSuccess ? '' : String(result.error?.message)).toBe(true);
      if (!result.isSuccess) return;
      const data = result.data.data as { items?: unknown[] };
      expect(Array.isArray(data.items)).toBe(true);
      expect(data.items!.length).toBeGreaterThan(0);
      const first = data.items![0] as Record<string, unknown>;
      expect(first.title != null || first.excerpt != null).toBe(true);
    }, 15_000);

    it('custom: example.com with selectors returns extracted fields', async () => {
      const fetchAdapter = new FetchHtmlAdapter();
      const adapterReal = new WebScraperRealAdapter(mockLogger, fetchAdapter);
      const result = await adapterReal.parse({
        url: 'https://example.com',
        type: 'custom',
        whatToCollect: ['title', 'description'],
        customSelectors: {
          strategy: 'css',
          selectors: {
            title: 'h1',
            description: 'p',
          },
        },
      });
      expect(result.isSuccess, result.isSuccess ? '' : String(result.error?.message)).toBe(true);
      if (!result.isSuccess) return;
      const data = result.data.data as { items?: unknown[] };
      expect(Array.isArray(data.items)).toBe(true);
      expect(data.items!.length).toBeGreaterThan(0);
      const first = data.items![0] as Record<string, unknown>;
      expect(first.title).toBeDefined();
      expect(String(first.title).length).toBeGreaterThan(0);
    }, 15_000);
  });
});
