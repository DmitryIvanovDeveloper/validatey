import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import ResultEx from '../../../../infrastructure/result/result';
import { TextFormattingPort } from '../../application/ports/text-formatting.port';
import { AiModuleError } from '../../domain/errors/ai.error';

const AI_PROXY_URL = 'https://cerebras-api.vercel.app/api/prompt';

const SYSTEM_PROMPT = `Format the following text so it looks professional and is easy to read. Apply these rules:
- Fix punctuation, capitalization, and grammar.
- Break into short paragraphs (2–4 sentences each); do not leave as one solid block.
- Where there are several items, reasons, or steps, format them as bullet points (use • or - at the start of each line).
- Keep a clear structure: one idea per paragraph, lists as bullets.
- Return ONLY the formatted text. No title, no "Formatted text:", no commentary.`;

@injectable()
export class TextFormattingLlmAdapter implements TextFormattingPort {
  constructor(
    @inject(ROOT_TYPES.HttpClient)
    private readonly _http: HttpClientPort
  ) {}

  async format(plainText: string): Promise<ResultEx<string, AiModuleError>> {
    const fullPrompt = `${SYSTEM_PROMPT}\n\n---\nText:\n${plainText}`;

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

      return ResultEx.success(content);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return ResultEx.failure(new AiModuleError(`Format failed: ${message}`));
    }
  }
}