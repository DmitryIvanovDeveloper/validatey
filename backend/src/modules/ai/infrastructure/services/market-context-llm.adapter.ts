import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import ResultEx from '../../../../infrastructure/result/result';
import {
  MarketContextLlmPort,
  MarketContextSuggestion,
  MarketContextLlmSynthesizeInput,
} from '../../application/ports/market-context-llm.port';
import { AiModuleError } from '../../domain/errors/ai.error';

const AI_PROXY_URL = 'https://cerebras-api.vercel.app/api/prompt';

const SYSTEM_PROMPT = `You are a market analyst. Using the provided search snippets and context, write three short paragraphs in English.

Respond with ONLY a valid JSON object in this exact format (no markdown, no extra text):
{"marketPicture":"...","marketFit":"...","differentiation":"..."}

- marketPicture: Current market picture — who are the players, what they offer, what they sell, who buys from them (2-4 sentences).
- marketFit: How the product fits the market — what share of paying audience it can get, positioning (2-3 sentences).
- differentiation: How the product differs from others — what qualities attract audience and can win new buyers who did not buy from competitors (2-3 sentences).

Keep each field under 600 characters. Use the search results to ground your answer; if snippets are missing or irrelevant, use general knowledge.`;

@injectable()
export class MarketContextLlmAdapter implements MarketContextLlmPort {
  constructor(
    @inject(ROOT_TYPES.HttpClient)
    private readonly _http: HttpClientPort
  ) {}

  async synthesize(input: MarketContextLlmSynthesizeInput): Promise<ResultEx<MarketContextSuggestion, AiModuleError>> {
    const snippetsText =
      input.searchSnippets.length > 0
        ? input.searchSnippets.map((s, i) => `[${i + 1}] ${s}`).join('\n\n')
        : 'No search snippets provided.';

    const userContent = [
      input.segmentDescription ? `Segment: ${input.segmentDescription}` : '',
      input.segmentDemographics ? `Demographics: ${input.segmentDemographics}` : '',
      input.productDescription ? `Product: ${input.productDescription}` : '',
      'Search results (snippets):',
      snippetsText,
    ]
      .filter(Boolean)
      .join('\n\n');

    const fullPrompt = `${SYSTEM_PROMPT}\n\n---\nUser input:\n${userContent}`;

    try {
      const response = await this._http.post<{ response?: string }>(
        AI_PROXY_URL,
        {
          prompt: fullPrompt,
          model: 'llama3.1-8b'
        },
        {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; Validatey/1.0)',
        }
      );

      const content = (response?.response ?? '').trim();
      if (!content) {
        return ResultEx.failure(new AiModuleError('Empty response from LLM'));
      }

      const parsed = this.parseJsonToSuggestion(content);
      if (!parsed) {
        return ResultEx.failure(new AiModuleError('Invalid or incomplete LLM response'));
      }

      return ResultEx.success(parsed);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return ResultEx.failure(new AiModuleError(`LLM synthesis failed: ${message}`));
    }
  }

  private parseJsonToSuggestion(content: string): MarketContextSuggestion | null {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      const obj = JSON.parse(match[0]) as Record<string, unknown>;
      const marketPicture = typeof obj.marketPicture === 'string' ? obj.marketPicture.trim() : '';
      const marketFit = typeof obj.marketFit === 'string' ? obj.marketFit.trim() : '';
      const differentiation = typeof obj.differentiation === 'string' ? obj.differentiation.trim() : '';
      if (!marketPicture && !marketFit && !differentiation) return null;
      return {
        marketPicture,
        marketFit,
        differentiation,
      };
    } catch {
      return null;
    }
  }
}
