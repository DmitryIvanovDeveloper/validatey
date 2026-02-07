import { injectable, inject } from 'inversify';
import puppeteer, { type Browser } from 'puppeteer';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import type { FetchHtmlPort } from '../../application/ports/fetch-html.port';

const NAVIGATION_TIMEOUT_MS = 30_000;
/** Wait after load so JS-rendered pricing/content can appear (SPA). */
const POST_LOAD_WAIT_MS = 3_000;
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * Fetches HTML via headless browser (Puppeteer).
 * Use for JS-rendered pages (e.g. Notion, Asana, SPA pricing).
 */
@injectable()
export class FetchHtmlBrowserAdapter implements FetchHtmlPort {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}

  async getHtml(url: string): Promise<string> {
    let browser: Browser | undefined;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });
      const page = await browser.newPage();
      await page.setUserAgent(USER_AGENT);
      await page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT_MS);

      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: NAVIGATION_TIMEOUT_MS,
      });
      if (!response || !response.ok()) {
        const status = response?.status() ?? 0;
        throw new Error(`HTTP ${status}: ${response?.statusText() ?? 'Failed to load'}`);
      }

      await new Promise((r) => setTimeout(r, POST_LOAD_WAIT_MS));
      const html = await page.content();
      this._logger.info('fetch-html-browser.getHtml', { url, length: html.length });
      return html;
    } finally {
      if (browser) {
        await browser.close().catch((e) => this._logger.warn('fetch-html-browser.close', { error: String(e) }));
      }
    }
  }
}
