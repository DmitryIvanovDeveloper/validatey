import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import ResultEx from '../../../../infrastructure/result/result';
import type {
  ScraperInsightsLlmPort,
  ScraperInsightsLlmInput,
} from '../../application/ports/scraper-insights-llm.port';

const AI_PROXY_URL = 'https://cerebras-api.vercel.app/api/prompt';

const SYSTEM_PROMPT = `You are a research analyst. Given raw scraped data (JSON), produce a short structured insights summary in markdown.

Rules:
- Write in the same language as the data (e.g. Russian if data is in Russian).
- Include: 2-5 bullet points or short paragraphs with key findings, numbers, or trends.
- Do not repeat raw JSON; summarize and interpret.
- Respond with ONLY the insights text (markdown allowed), no preamble.`;

@injectable()
export class ScraperInsightsLlmAdapter implements ScraperInsightsLlmPort {
  constructor(
    @inject(ROOT_TYPES.HttpClient)
    private readonly _http: HttpClientPort
  ) {}

  async generateInsights(
    input: ScraperInsightsLlmInput
  ): Promise<ResultEx<string, Error>> {
    const context = [
      input.sourceType ? `Source type: ${input.sourceType}` : null,
      input.researchGoal ? `Research goal: ${input.researchGoal}` : null,
    ]
      .filter(Boolean)
      .join('\n');
    const dataPreview =
      typeof input.rawResult === 'object' && input.rawResult !== null
        ? JSON.stringify(input.rawResult).slice(0, 6000)
        : String(input.rawResult);

    const userContent = [context, `Raw data (excerpt):\n${dataPreview}`].filter(Boolean).join('\n\n');

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
        return ResultEx.failure(new Error('Empty response from LLM'));
      }
      return ResultEx.success(raw);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return ResultEx.failure(new Error(`Generate insights failed: ${message}`));
    }
  }
}
