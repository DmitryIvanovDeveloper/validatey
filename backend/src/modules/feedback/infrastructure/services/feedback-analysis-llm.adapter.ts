import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import type { FeedbackAnalysisLlmPort, FeedbackItemForAnalysis } from '../../application/ports/feedback-analysis-llm.port';
import type { FeedbackAnalysis } from '../../domain/value-objects/feedback-analysis.vo';
import { FeedbackAnalysisError } from '../../domain/errors/feedback.error';
import ResultEx from '../../../../infrastructure/result/result';

const AI_PROXY_URL = 'https://cerebras-api.vercel.app/api/prompt';

const SYSTEM_PROMPT = `You are a product manager analyzing user feedback. Given a list of feedback items (type + text), produce a short analysis.

Respond with ONLY a valid JSON object (no markdown, no extra text):
{
  "summary": "2-4 sentence overall summary of the feedback",
  "themes": ["theme1", "theme2", "..."],
  "suggestedActions": ["action1", "action2", "..."]
}

Rules:
- summary: concise overview in English
- themes: 2-5 recurring themes or categories (short phrases)
- suggestedActions: 2-5 concrete next steps for the product team
- Use English for all fields.`;

@injectable()
export class FeedbackAnalysisLlmAdapter implements FeedbackAnalysisLlmPort {
  constructor(
    @inject(ROOT_TYPES.HttpClient)
    private readonly _http: HttpClientPort
  ) {}

  async analyze(items: FeedbackItemForAnalysis[]): Promise<ResultEx<FeedbackAnalysis, FeedbackAnalysisError>> {
    const content =
      items.length > 0
        ? items.map((item, i) => `[${i + 1}] (${item.type}) ${item.text}`).join('\n\n')
        : 'No feedback provided.';

    const userContent = `User feedback items:\n\n${content}`;

    try {
      const response = await this._http.post<{ response?: string }>(
        AI_PROXY_URL,
        { prompt: `${SYSTEM_PROMPT}\n\n---\n${userContent}` },
        {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; Validatey/1.0)',
        }
      );

      const raw = (response?.response ?? '').trim();
      if (!raw) {
        return ResultEx.failure(new FeedbackAnalysisError('Empty response from LLM'));
      }

      const analysis = this.parseResponse(raw);
      return ResultEx.success(analysis);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return ResultEx.failure(new FeedbackAnalysisError(`Feedback analysis failed: ${message}`));
    }
  }

  private parseResponse(raw: string): FeedbackAnalysis {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      return {
        summary: raw.slice(0, 500) || 'Analysis could not be parsed.',
        themes: [],
        suggestedActions: [],
      };
    }

    try {
      const obj = JSON.parse(match[0]) as Record<string, unknown>;
      const summary = typeof obj.summary === 'string' ? obj.summary.trim() : '';
      const themes = Array.isArray(obj.themes)
        ? (obj.themes as unknown[]).map((t) => (typeof t === 'string' ? t.trim() : String(t))).filter(Boolean)
        : [];
      const suggestedActions = Array.isArray(obj.suggestedActions)
        ? (obj.suggestedActions as unknown[])
            .map((a) => (typeof a === 'string' ? a.trim() : String(a)))
            .filter(Boolean)
        : [];

      return {
        summary: summary || 'No summary generated.',
        themes,
        suggestedActions,
      };
    } catch {
      return {
        summary: raw.slice(0, 500) || 'Analysis could not be parsed.',
        themes: [],
        suggestedActions: [],
      };
    }
  }
}
