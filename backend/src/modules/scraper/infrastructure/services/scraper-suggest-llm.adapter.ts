import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import ResultEx from '../../../../infrastructure/result/result';
import type {
  ScraperSuggestLlmPort,
  ScraperSuggestion,
  ScraperSuggestLlmInput,
} from '../../application/ports/scraper-suggest-llm.port';
import type { ScraperSourceType } from '../../domain/value-objects/scraper-source-type.vo';
import type { ScheduleFrequency } from '../../domain/value-objects/schedule-frequency.vo';
import type { ResearchGoal } from '../../domain/value-objects/research-goal.vo';
import { isScraperSourceType } from '../../domain/value-objects/scraper-source-type.vo';
import { isScheduleFrequency } from '../../domain/value-objects/schedule-frequency.vo';
import { isResearchGoal } from '../../domain/value-objects/research-goal.vo';

const AI_PROXY_URL = 'https://cerebras-api.vercel.app/api/prompt';

const SYSTEM_PROMPT = `You are a research assistant helping to configure a web data source (scraper) for market/product research.

Given the user's message and optional project context, suggest a scraper configuration.

Respond with ONLY a valid JSON object (no markdown, no extra text):
{
  "type": "competitor_sites" | "user_reviews" | "job_market" | "news_articles" | "custom",
  "name": "optional short name for the source or null",
  "urls": ["optional", "list", "of", "example URLs"] or omit if not applicable,
  "whatToCollect": ["item1", "item2", "..."],
  "frequency": "once" | "daily" | "weekly",
  "researchGoal": "price_strategy" | "user_pains" | "market_trends" | "competitor_features" | "find_respondents" or null
}

Rules:
- type: one of competitor_sites, user_reviews, job_market, news_articles, custom
- whatToCollect: 2-5 concrete things to collect (e.g. "Prices", "Reviews", "Headlines")
- frequency: once for one-off, daily for news/trends, weekly for competitors/reviews
- researchGoal: match hypothesis intent if clear; otherwise null
- Use Russian for whatToCollect labels if the user wrote in Russian, else English`;

@injectable()
export class ScraperSuggestLlmAdapter implements ScraperSuggestLlmPort {
  constructor(
    @inject(ROOT_TYPES.HttpClient)
    private readonly _http: HttpClientPort
  ) {}

  async suggest(input: ScraperSuggestLlmInput): Promise<ResultEx<ScraperSuggestion, Error>> {
    const context =
      input.projectContext?.name || input.projectContext?.description
        ? `Project: ${[input.projectContext.name, input.projectContext.description].filter(Boolean).join(' — ')}`
        : '';
    const userContent = [context, `User: ${input.message}`].filter(Boolean).join('\n\n');

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

      const suggestion = this.parseResponse(raw);
      return ResultEx.success(suggestion);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return ResultEx.failure(new Error(`Scraper suggest failed: ${message}`));
    }
  }

  private parseResponse(raw: string): ScraperSuggestion {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      return this.defaultSuggestion();
    }

    try {
      const obj = JSON.parse(match[0]) as Record<string, unknown>;
      const type = isScraperSourceType(String(obj.type)) ? (obj.type as ScraperSourceType) : 'custom';
      const name =
        obj.name === null || obj.name === undefined
          ? null
          : typeof obj.name === 'string'
            ? obj.name.trim() || null
            : null;
      const urls = Array.isArray(obj.urls)
        ? (obj.urls as unknown[]).map((u) => String(u).trim()).filter(Boolean)
        : undefined;
      const whatToCollect = Array.isArray(obj.whatToCollect)
        ? (obj.whatToCollect as unknown[]).map((w) => String(w).trim()).filter(Boolean)
        : ['Data'];
      const frequency = isScheduleFrequency(String(obj.frequency)) ? (obj.frequency as ScheduleFrequency) : 'once';
      const researchGoal =
        obj.researchGoal != null && isResearchGoal(String(obj.researchGoal))
          ? (String(obj.researchGoal) as ResearchGoal)
          : null;

      return {
        type,
        name: name ?? undefined,
        urls: urls && urls.length > 0 ? urls : undefined,
        whatToCollect: whatToCollect.length > 0 ? whatToCollect : ['Data'],
        frequency,
        researchGoal: researchGoal ?? undefined,
      };
    } catch {
      return this.defaultSuggestion();
    }
  }

  private defaultSuggestion(): ScraperSuggestion {
    return {
      type: 'custom',
      whatToCollect: ['Data'],
      frequency: 'once',
    };
  }
}
