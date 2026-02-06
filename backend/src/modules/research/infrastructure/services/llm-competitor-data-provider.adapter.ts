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

  private async fetchSearchSnippets(intent: ResearchIntent): Promise<string[]> {
    const apiKey = process.env.SERPER_API_KEY?.trim();
    if (!apiKey) {
      throw new ResearchDataCollectionError(
        'Competitor data collection not configured: SERPER_API_KEY is missing'
      );
    }
    const query = [intent.topic, intent.geography, intent.segment].filter(Boolean).join(' ');
    if (!query.trim()) {
      throw new ResearchDataCollectionError('Competitor data collection failed: no topic');
    }
    try {
      const response = await this._http.post<SerperResponse>(
        SERPER_URL,
        { q: `${query} competitors alternatives products`, num: 10 },
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

    return `You are a competitive intelligence analyst. Using ONLY the search snippets below, identify competitors and pricing.

Respond with ONLY a valid JSON object (no markdown, no extra text):
{"competitors":["Competitor A","Competitor B","Competitor C"],"priceRange":"e.g. $10-50/mo or Free - $100","rating":"e.g. 4.2/5 or N/A"}

Rules:
- Use only information from the snippets. If something is missing, use empty array or "Unknown".
- competitors: 0-8 competitor names or product names.
- priceRange: one short summary of typical pricing.
- rating: aggregate or typical rating if mentioned, else "N/A".
- Use English.

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
        ? (obj.competitors as unknown[]).filter((c): c is string => typeof c === 'string')
        : [];
      const priceRange = typeof obj.priceRange === 'string' ? obj.priceRange : undefined;
      const rating = typeof obj.rating === 'string' ? obj.rating : undefined;
      return {
        competitors: competitors.length > 0 ? competitors : undefined,
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
