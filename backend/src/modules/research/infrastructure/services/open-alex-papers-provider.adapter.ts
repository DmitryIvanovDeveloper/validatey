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

const OPENALEX_URL = 'https://api.openalex.org/works';

/** Minimum citation count — keep low so recent relevant papers aren't excluded. */
const MIN_CITATIONS = 2;
/** Maximum citation count — filters out mega-review papers (>2000 cit.) that match keywords but are off-topic. */
const MAX_CITATIONS = 2000;
/** Maximum number of papers to return. */
const MAX_PAPERS = 5;
/** Abstract snippet max length in characters. */
const ABSTRACT_MAX_LEN = 320;
/** Only papers from this year onwards. */
const MIN_YEAR = 2018;

const QUERY_GENERATION_PROMPT = `You are an academic search expert. Given a startup hypothesis, generate ONE precise English query to find relevant academic research papers.

Rules:
- Output ONLY the query string. No quotes, no explanation, no punctuation at the end.
- 3-5 words ONLY. Be very specific — use exact academic/psychological terms.
- Focus on the CORE mechanism: a specific behavior, social dynamic, or psychological effect.
- IMPORTANT: Do NOT use hyphens. Replace any hyphen with a space.
  Wrong: "give-to-get", "peer-to-peer"  →  Correct: "give to get", "peer to peer"
- Do NOT use: startup, platform, app, product, validation, market, business, AI, ML, software, technology, digital, online, system, user, engagement.
- Use precise terms: reciprocity, social exchange, prosocial, altruism, peer learning, advice giving, motivation, commitment, cooperation, norm, trust, community.
- One term per concept, not vague phrases.
- Examples:
  - "reciprocal peer feedback motivation"
  - "social exchange reciprocity cooperation"
  - "advice giving learning outcomes"
  - "prosocial behavior reciprocity norms"
  - "commitment consistency behavior change"`;

/** Inverted-index abstract from OpenAlex: { word: [positions...] } */
type InvertedIndex = Record<string, number[]>;

interface OpenAlexWork {
  readonly title?: string | null;
  readonly publication_year?: number | null;
  readonly cited_by_count?: number | null;
  readonly abstract_inverted_index?: InvertedIndex | null;
  readonly doi?: string | null;
  readonly primary_location?: {
    readonly landing_page_url?: string | null;
  } | null;
}

interface OpenAlexResponse {
  readonly results?: readonly OpenAlexWork[];
  readonly meta?: { readonly count?: number };
}

@injectable()
export class OpenAlexPapersProviderAdapter implements AcademicPapersProviderPort {
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
    this._logger.info('open-alex-papers-provider.start', { projectId });

    try {
      const query = await this.buildSearchQuery(intent);
      if (!query) {
        this._logger.warn('open-alex-papers-provider.empty-query', { projectId });
        return ResultEx.success(null);
      }

      const raw = await this.fetchFromApi(query, projectId);
      if (raw === null) {
        return ResultEx.success(null);
      }

      const papers = this.filterAndMap(raw, projectId);
      if (papers.length === 0) {
        this._logger.info('open-alex-papers-provider.no-relevant-papers', { projectId, query });
        return ResultEx.success(null);
      }

      const block: AcademicPapersBlock = {
        papers,
        searchQuery: query,
        fetchedAt: new Date(),
      };

      this._logger.info('open-alex-papers-provider.success', {
        projectId,
        count: papers.length,
        query,
      });

      return ResultEx.success(block);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this._logger.error('open-alex-papers-provider.exception', { projectId, error: message });
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

      const q = (response?.response ?? '').trim().replace(/^["']|["']$/g, '');
      if (q.length >= 8 && q.length <= 200) {
        this._logger.info('open-alex-papers-provider.query-generated', { query: q });
        return q;
      }
    } catch (err) {
      this._logger.warn('open-alex-papers-provider.query-llm-failed', {
        error: err instanceof Error ? err.message : String(err),
      });
    }

    const words = description.split(/\s+/).slice(0, 6).join(' ');
    return words.length >= 8 ? words : null;
  }

  private async fetchFromApi(query: string, projectId: string): Promise<readonly OpenAlexWork[] | null> {
    // OpenAlex concept IDs for Psychology (C15744967), Business (C144133560), Sociology (C17744445)
    // Filtering by concepts narrows results to relevant disciplines and avoids VR/AI/medicine papers
    const params = new URLSearchParams({
      search: query,
      filter: [
        `publication_year:>${MIN_YEAR - 1}`,
        `cited_by_count:>${MIN_CITATIONS - 1}`,
        'has_abstract:true',
        'concepts.id:C15744967|C144133560|C17744445',
      ].join(','),
      'per-page': '10',
      select: 'title,publication_year,cited_by_count,abstract_inverted_index,doi,primary_location',
    });

    const url = `${OPENALEX_URL}?${params.toString()}`;

    try {
      const response = await this._http.get<OpenAlexResponse>(url, {
        'User-Agent': 'Validatey/1.0 (mailto:research@validatey.com)',
      });

      const items = response?.results ?? null;
      this._logger.info('open-alex-papers-provider.api-response', {
        projectId,
        query,
        total: response?.meta?.count ?? 0,
        returned: items?.length ?? 0,
      });
      return items;
    } catch (err) {
      this._logger.warn('open-alex-papers-provider.api-error', {
        error: err instanceof Error ? err.message : String(err),
        query,
        projectId,
      });
      return null;
    }
  }

  private filterAndMap(raw: readonly OpenAlexWork[], projectId?: string): readonly AcademicPaper[] {
    const filtered = raw.filter((p): boolean => {
      const year = p.publication_year ?? 0;
      const citations = p.cited_by_count ?? 0;
      const hasAbstract = p.abstract_inverted_index != null &&
        Object.keys(p.abstract_inverted_index).length > 5;
      return (
        year >= MIN_YEAR &&
        citations >= MIN_CITATIONS &&
        citations <= MAX_CITATIONS &&
        hasAbstract &&
        !!p.title
      );
    });

    this._logger.info('open-alex-papers-provider.filter', {
      projectId,
      beforeFilter: raw.length,
      afterFilter: filtered.length,
    });

    return filtered
      .slice(0, MAX_PAPERS)
      .map((p): AcademicPaper => ({
        title: p.title ?? '',
        year: p.publication_year ?? null,
        abstractSnippet: this.reconstructAbstract(p.abstract_inverted_index ?? null),
        citationCount: p.cited_by_count ?? 0,
        doi: p.doi ?? null,
        url: p.primary_location?.landing_page_url ?? null,
      }));
  }

  /** Reconstruct plain text abstract from OpenAlex inverted index format. */
  private reconstructAbstract(index: InvertedIndex | null): string {
    if (!index) return '';

    const positions: Array<{ pos: number; word: string }> = [];
    for (const [word, posArr] of Object.entries(index)) {
      for (const pos of posArr) {
        positions.push({ pos, word });
      }
    }
    positions.sort((a, b) => a.pos - b.pos);

    const text = positions.map((p) => p.word).join(' ').trim();
    if (text.length <= ABSTRACT_MAX_LEN) return text;

    const cut = text.slice(0, ABSTRACT_MAX_LEN);
    const lastSpace = cut.lastIndexOf(' ');
    return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut) + '…';
  }
}
