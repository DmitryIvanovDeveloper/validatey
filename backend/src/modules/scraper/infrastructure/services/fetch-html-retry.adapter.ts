import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import type { FetchHtmlPort } from '../../application/ports/fetch-html.port';
import { TYPES as SCRAPER_TYPES } from '../bootstrap/types';

const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 1000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetry(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('timeout') || msg.includes('etimedout') || msg.includes('econnreset')) return true;
    if (msg.includes('http 5')) return true;
    if (msg.includes('network') || msg.includes('fetch')) return true;
  }
  return false;
}

/**
 * Wraps a FetchHtmlPort with retry logic (3 attempts, exponential backoff).
 * Implements FetchHtmlPort so use case and WebScraperRealAdapter are unchanged.
 */
@injectable()
export class FetchHtmlWithRetryAdapter implements FetchHtmlPort {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(SCRAPER_TYPES.FetchHtmlInner)
    private readonly _inner: FetchHtmlPort
  ) {}

  async getHtml(url: string): Promise<string> {
    let lastError: Error | undefined;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      try {
        return await this._inner.getHtml(url);
      } catch (e) {
        lastError = e instanceof Error ? e : new Error(String(e));
        this._logger.warn('fetch-html-retry.attempt-failed', {
          url,
          attempt: attempt + 1,
          maxAttempts: MAX_ATTEMPTS,
          error: lastError.message,
        });
        if (attempt < MAX_ATTEMPTS - 1 && shouldRetry(lastError)) {
          const delayMs = BASE_DELAY_MS * Math.pow(2, attempt);
          await delay(delayMs);
          continue;
        }
        throw lastError;
      }
    }
    throw lastError ?? new Error('Failed to fetch HTML');
  }
}
