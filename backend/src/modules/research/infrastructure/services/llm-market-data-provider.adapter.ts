import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import type { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import type { MarketDataProviderPort } from '../../application/ports/market-data-provider.port';
import type { ResearchIntent } from '../../application/use-cases/input-output/collect-research-data.io';
import type { MarketDataBlock } from '../../domain/value-objects/market-data-block.vo';
import { ResearchDataCollectionError } from '../../domain/errors/research.error';

const AI_PROXY_URL = 'https://cerebras-api.vercel.app/api/prompt';
const SERPER_URL = 'https://google.serper.dev/search';
const MAX_SNIPPETS = 15;
const MAX_SNIPPET_LENGTH = 400;

interface SerperOrganicItem {
  title?: string;
  snippet?: string;
}

interface SerperResponse {
  organic?: SerperOrganicItem[];
}

@injectable()
export class LlmMarketDataProviderAdapter implements MarketDataProviderPort {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(ROOT_TYPES.HttpClient)
    private readonly _http: HttpClientPort
  ) {}

  async fetchMarketData(
    projectId: string,
    intent: ResearchIntent
  ): Promise<ResultEx<MarketDataBlock | null, Error>> {
    this._logger.info('llm-market-data-provider.start', { projectId, topic: intent.topic });

    const snippets = await this.fetchSearchSnippets(intent);
    if (snippets.length === 0) {
      return ResultEx.failure(
        new ResearchDataCollectionError('Market data collection failed: no search results')
      );
    }

    const prompt = this.buildPrompt(intent, snippets);
    try {
      const response = await this._http.post<{ response?: string }>(
        AI_PROXY_URL,
        { prompt },
        { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 (compatible; Validatey/1.0)' }
      );
      const content = (response?.response ?? '').trim();
      if (!content) {
        return ResultEx.failure(
          new ResearchDataCollectionError('Market data collection failed: empty LLM response')
        );
      }
      const block = this.parseToMarketBlock(content);
      return ResultEx.success(block);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this._logger.error('llm-market-data-provider.llm-error', { projectId, error: message });
      return ResultEx.failure(new ResearchDataCollectionError(`Market data collection failed: ${message}`));
    }
  }

  private async fetchSearchSnippets(intent: ResearchIntent): Promise<string[]> {
    const apiKey = process.env.SERPER_API_KEY?.trim();
    if (!apiKey) {
      throw new ResearchDataCollectionError('Market data collection not configured: SERPER_API_KEY is missing');
    }
    const query = [intent.topic, intent.geography, intent.segment].filter(Boolean).join(' ');
    if (!query.trim()) {
      throw new ResearchDataCollectionError('Market data collection failed: no topic');
    }
    try {
      const response = await this._http.post<SerperResponse>(
        SERPER_URL,
        { q: `${query} market size growth trends`, num: 10 },
        { 'Content-Type': 'application/json', 'X-Api-Key': apiKey }
      );
      const organic = response?.organic ?? [];
      const snippets: string[] = [];
      for (const item of organic) {
        const text = (item.snippet ?? item.title ?? '').trim().slice(0, MAX_SNIPPET_LENGTH);
        if (text && !snippets.includes(text)) {
          snippets.push(text);
          if (snippets.length >= MAX_SNIPPETS) break;
        }
      }
      return snippets;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new ResearchDataCollectionError(`Market data search failed: ${message}`);
    }
  }

  private buildPrompt(intent: ResearchIntent, snippets: string[]): string {
    const context = [
      `Topic: ${intent.topic}`,
      intent.productDescription ? `Product: ${intent.productDescription}` : '',
      intent.geography ? `Geography: ${intent.geography}` : '',
      intent.segment ? `Segment: ${intent.segment}` : '',
      '---',
      'Search snippets:',
      snippets.join('\n\n'),
    ]
      .filter(Boolean)
      .join('\n');

    return `You are a market research analyst. Using ONLY the search snippets below, produce a short market data summary.

Respond with ONLY a valid JSON object (no markdown, no extra text):
{"size":"market size estimate (e.g. $Xbn, Y million users)","growth":"growth rate or trend (e.g. 15% CAGR)","trends":["trend 1","trend 2","trend 3"]}

Rules:
- Use only information from the snippets. If something is missing, use "Unknown" or an empty array.
- size: one short sentence or number.
- growth: one short sentence or percentage.
- trends: 0-5 short trend phrases.
- Use English.

Context:
${context}`;
  }

  private parseToMarketBlock(content: string): MarketDataBlock {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new ResearchDataCollectionError('Market data collection failed: invalid LLM response format');
    }
    try {
      const obj = JSON.parse(match[0]) as Record<string, unknown>;
      const size = typeof obj.size === 'string' ? obj.size : undefined;
      const growth = typeof obj.growth === 'string' ? obj.growth : undefined;
      const trends = Array.isArray(obj.trends)
        ? (obj.trends as unknown[]).filter((t): t is string => typeof t === 'string')
        : [];
      return { size, growth, trends: trends.length > 0 ? trends : undefined };
    } catch {
      throw new ResearchDataCollectionError('Market data collection failed: could not parse LLM JSON');
    }
  }
}
