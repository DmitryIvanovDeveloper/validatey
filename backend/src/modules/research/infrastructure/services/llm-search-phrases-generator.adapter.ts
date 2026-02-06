import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import ResultEx from '../../../../infrastructure/result/result';
import type { SearchPhrasesGeneratorPort } from '../../application/ports/search-phrases-generator.port';
import type { ResearchIntent } from '../../application/use-cases/input-output/collect-research-data.io';

const AI_PROXY_URL = 'https://cerebras-api.vercel.app/api/prompt';
const MAX_PHRASES = 12;

const SYSTEM_PROMPT = `You are a market researcher. Given a product hypothesis and optional segment/geography, generate short search phrases (2-6 words each) that users might type in Google when looking for this product or problem.

Rules:
- Generate exactly 8-12 phrases. Mix: problem phrases, solution phrases, product-type phrases, competitor-like queries.
- Each phrase: 2-6 words, lowercase, no quotes. E.g. "best project management for startups", "task tracking app pricing".
- Use English. If geography is given, you may include location in some phrases.
- Respond with ONLY a valid JSON object: {"phrases":["phrase1","phrase2",...]}`;

@injectable()
export class LlmSearchPhrasesGeneratorAdapter implements SearchPhrasesGeneratorPort {
  constructor(
    @inject(ROOT_TYPES.HttpClient)
    private readonly _http: HttpClientPort
  ) {}

  async generatePhrases(intent: ResearchIntent): Promise<ResultEx<string[], Error>> {
    const topic = (intent.topic ?? '').trim();
    if (!topic) {
      return ResultEx.success([]);
    }

    const context = [
      `Topic/Hypothesis: ${topic}`,
      intent.productDescription ? `Product: ${intent.productDescription}` : '',
      intent.segment ? `Segment: ${intent.segment}` : '',
      intent.geography ? `Geography: ${intent.geography}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const userContent = `Context:\n${context}\n\nGenerate search phrases for Google Autocomplete.`;

    try {
      const response = await this._http.post<{ response?: string }>(
        AI_PROXY_URL,
        { prompt: `${SYSTEM_PROMPT}\n\n---\n${userContent}` },
        { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 (compatible; Validatey/1.0)' }
      );

      const content = (response?.response ?? '').trim();
      const phrases = this.parsePhrases(content);
      return ResultEx.success(phrases.slice(0, MAX_PHRASES));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return ResultEx.failure(new Error(`Search phrases generation failed: ${message}`));
    }
  }

  private parsePhrases(content: string): string[] {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return [];

    try {
      const obj = JSON.parse(match[0]) as Record<string, unknown>;
      const arr = obj.phrases;
      if (!Array.isArray(arr)) return [];
      return (arr as unknown[]).filter((p): p is string => typeof p === 'string' && p.trim().length > 0);
    } catch {
      return [];
    }
  }
}
