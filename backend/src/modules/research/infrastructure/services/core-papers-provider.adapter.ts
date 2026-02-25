import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import type { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import type { AcademicPapersProviderPort } from '../../application/ports/academic-papers-provider.port';
import type { AcademicPaper, AcademicPapersBlock } from '../../domain/value-objects/academic-papers-block.vo';
import type { ResearchIntent } from '../../application/use-cases/input-output/collect-research-data.io';

const AI_PROXY_URL =
  process.env.SYNTHESIS_LLM_URL ||
  process.env.LLM_SERVICE_URL ||
  'https://cerebras-api.vercel.app/api/prompt';

const CORE_SEARCH_URL = 'https://api.core.ac.uk/v3/search/works/';

// CORE citation counts and year data are poorly maintained.
// Only filter by presence of title + abstract; sort by year desc.
const MIN_ABSTRACT_LEN = 80;
const MAX_PAPERS = 5;
const ABSTRACT_MAX_LEN = 320;

const QUERY_GENERATION_PROMPT = `You are an academic search expert. Given a startup hypothesis, generate ONE precise English query to find relevant academic research papers.

Rules:
- Output ONLY the query string. No quotes, no explanation, no punctuation at the end.
- 3-5 words ONLY. Use exact academic/psychological terms.
- Focus on the CORE behavioral or social mechanism — not the product or platform.
- Do NOT use hyphens (replace with space). Do NOT use: startup, platform, app, product, validation, market, business, AI, ML, software, technology, digital, online, system, user, engagement.
- Use precise terms: reciprocity, social exchange, prosocial, altruism, peer learning, advice giving, motivation, commitment, cooperation, norm, trust, community.
- Examples:
  - "reciprocal peer feedback motivation"
  - "social exchange reciprocity cooperation"
  - "advice giving learning outcomes"
  - "prosocial behavior reciprocity norms"
  - "commitment consistency behavior change"`;

/** Raw work shape from CORE API v3. */
interface CoreWork {
  readonly id?: number | null;
  readonly title?: string | null;
  readonly abstract?: string | null;
  readonly yearPublished?: number | null;
  readonly citationCount?: number | null;
  readonly doi?: string | null;
  readonly downloadUrl?: string | null;
  readonly fieldOfStudy?: string | null;
}

interface CoreSearchResponse {
  readonly totalHits?: number;
  readonly results?: readonly CoreWork[];
}

@injectable()
export class CorePapersProviderAdapter implements AcademicPapersProviderPort {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(ROOT_TYPES.HttpClient)
    private readonly _http: HttpClientPort
  ) {}

  async fetchAcademicPapers(
    projectId: string,
    intent: ResearchIntent
  ): Promise<ResultEx<AcademicPapersBlock | null, Error>> {
    this._logger.info('core-papers-provider.start', { projectId });

    try {
      const query = await this.buildSearchQuery(intent);
      if (!query) {
        this._logger.warn('core-papers-provider.empty-query', { projectId });
        return ResultEx.success(null);
      }

      const raw = await this.fetchFromApi(query, projectId);
      if (raw === null) {
        return ResultEx.success(null);
      }

      const papers = this.filterAndMap(raw, projectId);
      if (papers.length === 0) {
        this._logger.info('core-papers-provider.no-relevant-papers', { projectId, query });
        return ResultEx.success(null);
      }

      const block: AcademicPapersBlock = {
        papers,
        searchQuery: query,
        fetchedAt: new Date(),
      };

      this._logger.info('core-papers-provider.success', {
        projectId,
        count: papers.length,
        query,
      });

      return ResultEx.success(block);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this._logger.error('core-papers-provider.exception', { projectId, error: message });
      return ResultEx.success(null);
    }
  }

  private async buildSearchQuery(intent: ResearchIntent): Promise<string | null> {
    const description = (intent.productDescription ?? intent.topic ?? '').trim();
    if (!description) return null;

    const firstSentence = description.split(/[.!?\n]/)[0]?.trim() ?? description;
    const input = firstSentence.slice(0, 400);

    try {
      const response = await this._http.post<{ response?: string }>(
        AI_PROXY_URL,
        {
          prompt: `${QUERY_GENERATION_PROMPT}\n\nHypothesis: ${input}`,
          model: 'llama3.3-70b',
          max_tokens: 64,
        },
        {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; Validatey/1.0)',
        }
      );

      const q = (response?.response ?? '')
        .trim()
        .replace(/^["']|["']$/g, '')
        .replace(/-/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();

      if (q.length >= 8 && q.length <= 200) {
        this._logger.info('core-papers-provider.query-generated', { query: q });
        return q;
      }
    } catch (err) {
      this._logger.warn('core-papers-provider.query-llm-failed', {
        error: err instanceof Error ? err.message : String(err),
      });
    }

    const words = description.replace(/-/g, ' ').split(/\s+/).slice(0, 5).join(' ');
    return words.length >= 8 ? words : null;
  }

  private async fetchFromApi(query: string, projectId: string): Promise<readonly CoreWork[] | null> {
    const params = new URLSearchParams({
      q: query,
      // limit=10 is the max that reliably fits in Node.js fetch body buffer.
      // Node.js native fetch stalls on larger chunked responses from core.ac.uk.
      limit: '10',
      // Exclude full paper text to keep response small (<100KB vs multi-MB)
      exclude: 'fullText',
    });

    const url = `${CORE_SEARCH_URL}?${params.toString()}`;
    const apiKey = process.env.CORE_API_KEY?.trim() ?? '';

    try {
      const response = await this._http.get<CoreSearchResponse>(url, {
        Authorization: `Bearer ${apiKey}`,
      });

      const items = response?.results ?? null;
      this._logger.info('core-papers-provider.api-response', {
        projectId,
        query,
        totalHits: response?.totalHits ?? 0,
        returned: items?.length ?? 0,
      });

      return items;
    } catch (err) {
      this._logger.warn('core-papers-provider.api-error', {
        error: err instanceof Error ? err.message : String(err),
        query,
        projectId,
      });
      return null;
    }
  }

  private filterAndMap(raw: readonly CoreWork[], projectId?: string): readonly AcademicPaper[] {
    // CORE citation / year data is incomplete — filter only by abstract + title presence
    const filtered = raw.filter((p): boolean => {
      const abstract = p.abstract?.trim() ?? '';
      return abstract.length >= MIN_ABSTRACT_LEN && !!p.title;
    });

    this._logger.info('core-papers-provider.filter', {
      projectId,
      beforeFilter: raw.length,
      afterFilter: filtered.length,
    });

    // Sort: prefer recent papers (non-null year desc), fall back to CORE relevance order
    return [...filtered]
      .sort((a, b) => (b.yearPublished ?? 0) - (a.yearPublished ?? 0))
      .slice(0, MAX_PAPERS)
      .map((p): AcademicPaper => ({
        title: p.title ?? '',
        year: p.yearPublished ?? null,
        abstractSnippet: this.truncateAbstract(p.abstract ?? ''),
        citationCount: p.citationCount ?? 0,
        doi: p.doi ?? null,
        url: p.downloadUrl ?? null,
      }));
  }

  private truncateAbstract(text: string): string {
    const clean = text.replace(/\s+/g, ' ').trim();
    if (clean.length <= ABSTRACT_MAX_LEN) return clean;
    const cut = clean.slice(0, ABSTRACT_MAX_LEN);
    const lastSpace = cut.lastIndexOf(' ');
    return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut) + '…';
  }
}
