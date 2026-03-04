import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import type { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import type { CompetitorDataProviderPort } from '../../application/ports/competitor-data-provider.port';
import type { ResearchIntent } from '../../application/use-cases/input-output/collect-research-data.io';
import type { CompetitorInfoBlock } from '../../domain/value-objects/competitor-info-block.vo';
import { ResearchDataCollectionError } from '../../domain/errors/research.error';

const AI_PROXY_URL = 'https://cerebras-api.vercel.app/api/prompt';
const SERPER_URL = 'https://google.serper.dev/search';
const MAX_SNIPPETS = 15;
const MAX_SNIPPET_LENGTH = 400;
/** Serper allows max 2048 characters for the search query. */
const SERPER_QUERY_MAX_LENGTH = 2000;
/** Max length for LLM-generated search query (keeps under Serper limit with suffix). */
const LLM_QUERY_MAX_LENGTH = 1800;

const SEARCH_QUERY_PROMPT = `You are a search query expert. Given a product description and target audience, generate ONE precise Google search query to find direct competitors and alternatives for THIS specific startup/founder tool.

Rules:
- Output ONLY the search query. No quotes, no explanation, no punctuation at the end.
- 4-8 words maximum. Focus on the product TYPE for founders, not the company name.
- Name the product TYPE for entrepreneurs (e.g. "startup idea validation tool", "founder feedback platform", "customer discovery tool"), not the brand.
- Append "alternatives" or "competitors" at the end.
- IMPORTANT: This is a tool for FOUNDERS and ENTREPRENEURS — focus on startup ecosystem tools.
  Do NOT search for: ML model validation tools, software testing tools, data validation tools.
  DO search for: startup validation, founder feedback, idea validation, customer discovery, pre-launch tools.
- Example outputs:
  - "startup idea validation tool alternatives"
  - "pre-launch founder feedback platform competitors"
  - "customer discovery tool for entrepreneurs alternatives"
- Maximum 120 characters.`;

interface SerperOrganicItem {
  title?: string;
  snippet?: string;
}

interface SerperResponse {
  organic?: SerperOrganicItem[];
}

@injectable()
export class LlmCompetitorDataProviderAdapter implements CompetitorDataProviderPort {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(ROOT_TYPES.HttpClient)
    private readonly _http: HttpClientPort
  ) {}

  async fetchCompetitorData(
    projectId: string,
    intent: ResearchIntent
  ): Promise<ResultEx<CompetitorInfoBlock | null, Error>> {
    this._logger.info('llm-competitor-data-provider.start', { projectId, topic: intent.topic });

    const snippets = await this.fetchSearchSnippets(intent);
    if (snippets.length === 0) {
      return ResultEx.failure(
        new ResearchDataCollectionError('Competitor data collection failed: no search results')
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
          new ResearchDataCollectionError('Competitor data collection failed: empty LLM response')
        );
      }
      const block = this.parseToCompetitorBlock(content);
      return ResultEx.success(block);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this._logger.error('llm-competitor-data-provider.llm-error', { projectId, error: message });
      return ResultEx.failure(
        new ResearchDataCollectionError(`Competitor data collection failed: ${message}`)
      );
    }
  }

  /**
   * Extracts first sentence (≤200 chars) from a longer text — gives LLM focused context
   * without flooding it with the full hypothesis.
   */
  private extractFirstSentence(text: string, maxLen = 200): string {
    const match = text.match(/^[^.!?\n]+[.!?]?/);
    const sentence = (match ? match[0] : text).trim();
    return sentence.length > maxLen ? sentence.slice(0, maxLen) : sentence;
  }

  private async buildSearchQueryForSerper(intent: ResearchIntent): Promise<string> {
    // Use hypothesis description only — project name confuses LLM (e.g. "Showcase" → demo platforms)
    const description = intent.productDescription?.trim() || intent.topic?.trim();
    if (!description) {
      throw new ResearchDataCollectionError('Competitor data collection failed: no topic');
    }

    const firstSentence = this.extractFirstSentence(description);
    const geoNote = intent.geography ? ` (${intent.geography})` : '';
    // Include segment to help LLM identify the right competitor category
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
        this._logger.info('llm-competitor-data-provider.search-query-llm', { query: q });
        return q;
      }
    } catch (err) {
      this._logger.warn('llm-competitor-data-provider.search-query-llm-fallback', {
        error: err instanceof Error ? err.message : String(err),
      });
    }

    // Fallback: first sentence of hypothesis + suffix (no project name)
    return `${firstSentence.slice(0, 150)} competitors alternatives`.slice(0, SERPER_QUERY_MAX_LENGTH);
  }

  private async fetchSearchSnippets(intent: ResearchIntent): Promise<string[]> {
    const apiKey = process.env.SERPER_API_KEY?.trim();
    if (!apiKey) {
      throw new ResearchDataCollectionError(
        'Competitor data collection not configured: SERPER_API_KEY is missing'
      );
    }

    const query = await this.buildSearchQueryForSerper(intent);
    const q = query.length <= SERPER_QUERY_MAX_LENGTH ? query : query.slice(0, SERPER_QUERY_MAX_LENGTH);

    try {
      const needsSuffix = !q.toLowerCase().includes('competitor') && !q.toLowerCase().includes('alternative');
      const finalQ = (needsSuffix ? `${q} competitors alternatives` : q).slice(0, SERPER_QUERY_MAX_LENGTH);
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
      throw new ResearchDataCollectionError(`Competitor data search failed: ${message}`);
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

    return `You are a competitive intelligence analyst. Using ONLY the search snippets below, identify competitors and pricing for a STARTUP/FOUNDER TOOL.

Respond with ONLY a valid JSON object (no markdown, no extra text):
{"competitors":["Competitor A","Competitor B","Competitor C"],"priceRange":"e.g. $10-50/mo or Free - $100","rating":"e.g. 4.2/5 or N/A"}

Rules:
- Use only information from the snippets. If something is missing or snippets are insufficient, use null/undefined instead of "Unknown".
- competitors: 0-8 competitor names that are DIRECT alternatives for founders/entrepreneurs, or null if none found.
- priceRange: one short summary of typical pricing, or null if not available.
- rating: aggregate or typical rating if mentioned, or null if not available.
- Use English.
- RELEVANCE CHECK: Only include tools that serve founders, entrepreneurs, or early-stage startups.
  Do NOT list: project management tools (Trello, Basecamp), design tools (Figma, Sketch),
  code editors, e-commerce platforms (Shopify), content agencies, or generic communities (Reddit, Indie Hackers, Facebook groups) — unless the snippets explicitly identify them as a dedicated feedback/validation product for founders.
  If no relevant competitors found in snippets, return {"competitors":null,"priceRange":null,"rating":null}.

Context:
${context}`;
  }

  private parseToCompetitorBlock(content: string): CompetitorInfoBlock {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new ResearchDataCollectionError(
        'Competitor data collection failed: invalid LLM response format'
      );
    }
    try {
      const obj = JSON.parse(match[0]) as Record<string, unknown>;
      const competitors = Array.isArray(obj.competitors)
        ? (obj.competitors as unknown[]).filter((c): c is string => typeof c === 'string' && c.trim().length > 0)
        : undefined;
      const priceRange = (typeof obj.priceRange === 'string' && obj.priceRange.trim()) ? obj.priceRange.trim() : undefined;
      const rating = (typeof obj.rating === 'string' && obj.rating.trim()) ? obj.rating.trim() : undefined;
      return {
        competitors: competitors && competitors.length > 0 ? competitors : undefined,
        priceRange,
        rating,
      };
    } catch {
      throw new ResearchDataCollectionError(
        'Competitor data collection failed: could not parse LLM JSON'
      );
    }
  }
}
