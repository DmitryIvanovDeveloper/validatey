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
/** Serper allows max 2048 characters for the search query. */
const SERPER_QUERY_MAX_LENGTH = 2000;
const LLM_QUERY_MAX_LENGTH = 1800;

const SEARCH_QUERY_PROMPT = `You are a search query expert. Given a product description and target audience, generate ONE precise Google search query to find market size, growth rate and industry trends for THIS specific business/startup tool.

Rules:
- Output ONLY the search query. No quotes, no explanation, no punctuation at the end.
- 4-8 words maximum. Name the MARKET CATEGORY for the target audience, not the product brand.
- Focus on the business niche (e.g. "startup idea validation software market size", "founder feedback platform market growth").
- Append "market size" or "industry trends" at the end.
- IMPORTANT: This is a tool for FOUNDERS and ENTREPRENEURS — NOT ML/AI model validation, NOT software testing.
  Do NOT generate queries about: machine learning validation, AI model testing, data validation, software QA.
  DO generate queries about: startup tools, founder tools, customer discovery tools, idea validation for entrepreneurs.
- Example outputs:
  - "startup idea validation tool market size"
  - "indie founder customer discovery platform market growth"
  - "pre-launch product feedback tool market size"
- Maximum 120 characters.`;

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

  private extractFirstSentence(text: string, maxLen = 200): string {
    const match = text.match(/^[^.!?\n]+[.!?]?/);
    const sentence = (match ? match[0] : text).trim();
    return sentence.length > maxLen ? sentence.slice(0, maxLen) : sentence;
  }

  private async buildSearchQueryForSerper(intent: ResearchIntent): Promise<string> {
    // Use hypothesis description only — project name confuses LLM (e.g. "Showcase" → demo platforms)
    const description = intent.productDescription?.trim() || intent.topic?.trim();
    if (!description) {
      throw new ResearchDataCollectionError('Market data collection failed: no topic');
    }

    const firstSentence = this.extractFirstSentence(description);
    const geoNote = intent.geography ? ` (${intent.geography})` : '';
    // Include segment to help LLM narrow down the right market category
    const segmentNote = intent.segment
      ? `\nTarget audience: ${intent.segment.slice(0, 150)}`
      : '';
    const context = `Product description: ${firstSentence}${geoNote}${segmentNote}`;

    try {
      const prompt = `${SEARCH_QUERY_PROMPT}\n\nInput:\n${context}`;
      const response = await this._http.post<{ response?: string }>(
        AI_PROXY_URL,
        { prompt },
        { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 (compatible; Validatey/1.0)' }
      );
      const q = (response?.response ?? '').trim().replace(/^["']|["']$/g, '').slice(0, LLM_QUERY_MAX_LENGTH);
      if (q.length >= 10) {
        this._logger.info('llm-market-data-provider.search-query-llm', { query: q });
        return q;
      }
    } catch (err) {
      this._logger.warn('llm-market-data-provider.search-query-llm-fallback', {
        error: err instanceof Error ? err.message : String(err),
      });
    }

    // Fallback: first sentence of hypothesis + market suffix (no project name)
    return `${firstSentence.slice(0, 150)} market size growth`.slice(0, SERPER_QUERY_MAX_LENGTH);
  }

  private async fetchSearchSnippets(intent: ResearchIntent): Promise<string[]> {
    const apiKey = process.env.SERPER_API_KEY?.trim();
    if (!apiKey) {
      throw new ResearchDataCollectionError('Market data collection not configured: SERPER_API_KEY is missing');
    }

    const query = await this.buildSearchQueryForSerper(intent);
    const q = query.slice(0, SERPER_QUERY_MAX_LENGTH);
    const needsSuffix =
      !q.toLowerCase().includes('market') && !q.toLowerCase().includes('trend') && !q.toLowerCase().includes('growth');
    const finalQ = (needsSuffix ? `${q} market size growth trends` : q).slice(0, SERPER_QUERY_MAX_LENGTH);

    try {
      const response = await this._http.post<SerperResponse>(
        SERPER_URL,
        { q: finalQ, num: 10 },
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

    return `You are a market research analyst. Using ONLY the search snippets below, produce a short market data summary for a STARTUP TOOL for founders and entrepreneurs.

Respond with ONLY a valid JSON object (no markdown, no extra text):
{"size":"<actual market size from snippets, e.g. $2.5 billion or 500K active users>","growth":"<actual growth rate from snippets, e.g. 18% CAGR 2024-2030>","trends":["trend 1","trend 2","trend 3"]}

Rules:
- Use only information from the snippets. If something is missing or snippets are insufficient, use undefined/null instead of "Unknown".
- size: one short sentence or number, or undefined if not available.
- growth: one short sentence or percentage, or undefined if not available.
- trends: 0-5 short trend phrases, or undefined if not available.
- Use English.
- RELEVANCE CHECK: If the snippets are about ML/AI model validation, software testing, data quality validation,
  or any technical validation unrelated to startup/founder tools — output {"size":null,"growth":null,"trends":null}.
  Only summarize if snippets clearly describe the market for startup tools, customer discovery, or founder feedback platforms.
  If no relevant data found, return all fields as null/undefined.

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
      const size = (typeof obj.size === 'string' && obj.size.trim()) ? obj.size.trim() : undefined;
      const growth = (typeof obj.growth === 'string' && obj.growth.trim()) ? obj.growth.trim() : undefined;
      const trends = Array.isArray(obj.trends)
        ? (obj.trends as unknown[]).filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
        : undefined;
      return { size, growth, trends };
    } catch {
      throw new ResearchDataCollectionError('Market data collection failed: could not parse LLM JSON');
    }
  }
}
