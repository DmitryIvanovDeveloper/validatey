import ResultEx from '../../../../infrastructure/result/result';
import type { ScraperSource } from '../../domain/entities/scraper-source.entity';

export interface ScraperParseConfig {
  readonly url: string;
  readonly type: ScraperSource['type'];
  readonly whatToCollect: readonly string[];
  readonly customSelectors: ScraperSource['customSelectors'];
}

export interface ScraperParseResult {
  readonly url: string;
  readonly data: Record<string, unknown>;
  readonly items?: unknown[];
}

export interface WebScraperPort {
  /** Parse a single URL and return structured data. */
  parse(config: ScraperParseConfig): Promise<ResultEx<ScraperParseResult, Error>>;
}
