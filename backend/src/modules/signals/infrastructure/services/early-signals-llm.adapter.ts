import { randomUUID } from 'crypto';
import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import ResultEx from '../../../../infrastructure/result/result';
import {
  EarlySignalsLlmPort,
} from '../../application/ports/early-signals-llm.port';
import { EarlySignal, EarlySignalType } from '../../domain/entities/early-signal.entity';
import { EarlySignalsLlmError } from '../../domain/errors/early-signals.error';

const AI_PROXY_URL = 'https://cerebras-api.vercel.app/api/prompt';

const SYSTEM_PROMPT = `You are an analyst for product validation. Analyze the respondent comments and extract early signals: positive, negative, or neutral insights about the product/hypothesis.

Respond with ONLY a valid JSON array (no markdown, no extra text). Each item:
{"type":"positive"|"negative"|"neutral","title":"Short title","description":"1-2 sentence explanation"}

Rules:
- type: positive = favorable signal, negative = concern/red flag, neutral = mixed or observational
- title: brief headline (under 80 chars)
- description: concise explanation grounded in the comments
- Return 1-5 signals. If comments are insufficient, return fewer.
- Use English for title and description.`;

@injectable()
export class EarlySignalsLlmAdapter implements EarlySignalsLlmPort {
  constructor(
    @inject(ROOT_TYPES.HttpClient)
    private readonly _http: HttpClientPort
  ) {}

  async analyzeComments(
    comments: string[],
    hypothesis?: string
  ): Promise<ResultEx<EarlySignal[], EarlySignalsLlmError>> {
    const commentsText = comments.length > 0
      ? comments.map((c, i) => `[${i + 1}] ${c}`).join('\n\n')
      : 'No comments provided.';

    const userContent = [
      hypothesis ? `Hypothesis context: ${hypothesis}` : '',
      'Respondent comments:',
      commentsText,
    ]
      .filter(Boolean)
      .join('\n\n');

    const fullPrompt = `${SYSTEM_PROMPT}\n\n---\nUser input:\n${userContent}`;

    try {
      const response = await this._http.post<{ response?: string }>(
        AI_PROXY_URL,
        { prompt: fullPrompt },
        {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; Validatey/1.0)',
        }
      );

      const content = (response?.response ?? '').trim();
      if (!content) {
        return ResultEx.failure(new EarlySignalsLlmError('Empty response from LLM'));
      }

      const signals = this.parseJsonToSignals(content);
      return ResultEx.success(signals);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return ResultEx.failure(new EarlySignalsLlmError(`LLM analysis failed: ${message}`));
    }
  }

  private parseJsonToSignals(content: string): EarlySignal[] {
    const match = content.match(/\[[\s\S]*\]/);
    if (!match) return [];

    try {
      const arr = JSON.parse(match[0]) as Array<Record<string, unknown>>;
      if (!Array.isArray(arr)) return [];

      const now = new Date();
      const validTypes: EarlySignalType[] = ['positive', 'negative', 'neutral'];

      return arr
        .filter((item): item is Record<string, unknown> => item && typeof item === 'object')
        .map((item) => {
          const type = validTypes.includes((item.type as EarlySignalType)) ? (item.type as EarlySignalType) : 'neutral';
          const title = typeof item.title === 'string' ? item.title.trim() || 'Signal' : 'Signal';
          const description = typeof item.description === 'string' ? item.description.trim() : '';

          return {
            id: randomUUID(),
            type,
            title,
            description,
            timestamp: now,
          } as EarlySignal;
        });
    } catch {
      return [];
    }
  }
}
