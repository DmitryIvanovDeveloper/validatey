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

const SEMANTIC_SCHOLAR_BASE = 'https://api.semanticscholar.org/graph/v1';

/**
 * Fields of study that are relevant for startup / founder hypothesis research.
 * Excludes Computer Science, Medicine, Physics etc. to avoid unrelated papers.
 */
const RELEVANT_FIELDS_OF_STUDY = [
  'Psychology',
  'Business',
  'Sociology',
  'Economics',
  'Education',
].join(',');

/** Publication types most likely to contain empirical findings. */
const PUBLICATION_TYPES = ['JournalArticle', 'Review', 'Conference', 'Study'].join(',');

/** Fields to request from the API. */
const RESPONSE_FIELDS = 'title,year,abstract,citationCount,externalIds,url';

/** Maximum papers to include in the block. */
const MAX_PAPERS = 5;
/** Abstract truncation limit. */
const ABSTRACT_MAX_LEN = 320;
/** Minimum year (from swagger `year` param: "2018-"). */
const MIN_YEAR = 2018;
/** Minimum citations (from swagger `minCitationCount` param). */
const MIN_CITATIONS = 3;

const QUERY_GENERATION_PROMPT = `You are an academic search expert. Given a startup hypothesis, generate ONE precise English query for Semantic Scholar paper search.

Rules:
- Output ONLY the query string. No quotes, no explanation.
- 3-6 words. Use academic/psychological terminology.
- Focus on the CORE behavioral or social mechanism — not the product or platform.
- IMPORTANT: Do NOT use hyphens. Semantic Scholar does not support hyphenated terms.
  Wrong: "give-to-get reciprocity"  →  Correct: "give to get reciprocity"
- Do NOT use: startup, platform, app, software, ML, AI, model, validation, testing.
- Use terms from: psychology, behavioral economics, social science, organizational behavior.
- Examples:
  - "reciprocal feedback peer learning"
  - "give to get reciprocity motivation"
  - "advice giving learning advisor"
  - "social exchange online communities participation"
  - "user retention habit formation social"`;

/** Raw paper shape from Semantic Scholar API. */
interface SemanticScholarPaperRaw {
  readonly paperId?: string;
  readonly title?: string;
  readonly year?: number | null;
  readonly abstract?: string | null;
  readonly citationCount?: number | null;
  readonly externalIds?: { readonly DOI?: string } | null;
  readonly url?: string | null;
}

interface SemanticScholarResponse {
  readonly data?: readonly SemanticScholarPaperRaw[];
  readonly total?: number;
  readonly next?: number;
}

@injectable()
export class SemanticScholarPapersProviderAdapter implements AcademicPapersProviderPort {
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
    this._logger.info('semantic-scholar-papers-provider.start', { projectId });

    try {
      const query = await this.buildSearchQuery(intent);
      if (!query) {
        this._logger.warn('semantic-scholar-papers-provider.empty-query', { projectId });
        return ResultEx.success(null);
      }

      const raw = await this.fetchFromApi(query, projectId);
      if (raw === null) {
        return ResultEx.success(null);
      }

      const papers = this.mapPapers(raw);
      if (papers.length === 0) {
        this._logger.info('semantic-scholar-papers-provider.no-relevant-papers', { projectId, query });
        return ResultEx.success(null);
      }

      const block: AcademicPapersBlock = {
        papers,
        searchQuery: query,
        fetchedAt: new Date(),
      };

      this._logger.info('semantic-scholar-papers-provider.success', {
        projectId,
        count: papers.length,
        query,
      });

      return ResultEx.success(block);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this._logger.error('semantic-scholar-papers-provider.exception', { projectId, error: message });
      // Non-fatal: pipeline continues without papers
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
        // Semantic Scholar does not support hyphens — replace with space
        .replace(/-/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();

      if (q.length >= 8 && q.length <= 200) {
        this._logger.info('semantic-scholar-papers-provider.query-generated', { query: q });
        return q;
      }
    } catch (err) {
      this._logger.warn('semantic-scholar-papers-provider.query-llm-failed', {
        error: err instanceof Error ? err.message : String(err),
      });
    }

    // Fallback: first 5 words of description, no hyphens
    const words = description.replace(/-/g, ' ').split(/\s+/).slice(0, 5).join(' ');
    return words.length >= 8 ? words : null;
  }

  private async fetchFromApi(
    query: string,
    projectId: string
  ): Promise<readonly SemanticScholarPaperRaw[] | null> {
    const params = new URLSearchParams({
      query,
      fields: RESPONSE_FIELDS,
      fieldsOfStudy: RELEVANT_FIELDS_OF_STUDY,
      publicationTypes: PUBLICATION_TYPES,
      year: `${MIN_YEAR}-`,
      minCitationCount: String(MIN_CITATIONS),
      limit: '20',
    });

    const url = `${SEMANTIC_SCHOLAR_BASE}/paper/search?${params.toString()}`;

    const headers: Record<string, string> = {};
    const apiKey = process.env.SEMANTIC_SCHOLAR_API_KEY?.trim();
    if (apiKey) {
      headers['x-api-key'] = apiKey;
    }

    try {
      const response = await this._http.get<SemanticScholarResponse>(url, headers);
      const items = response?.data ?? null;

      this._logger.info('semantic-scholar-papers-provider.api-response', {
        projectId,
        query,
        total: response?.total ?? 0,
        returned: items?.length ?? 0,
        hasApiKey: !!apiKey,
      });

      return items;
    } catch (err) {
      this._logger.warn('semantic-scholar-papers-provider.api-error', {
        error: err instanceof Error ? err.message : String(err),
        query,
        projectId,
      });
      return null;
    }
  }

  private mapPapers(raw: readonly SemanticScholarPaperRaw[]): readonly AcademicPaper[] {
    return raw
      .filter((p): boolean => !!p.title && typeof p.abstract === 'string' && p.abstract.trim().length > 30)
      .slice(0, MAX_PAPERS)
      .map((p): AcademicPaper => ({
        title: p.title ?? '',
        year: p.year ?? null,
        abstractSnippet: this.truncateAbstract(p.abstract ?? ''),
        citationCount: p.citationCount ?? 0,
        doi: p.externalIds?.DOI ?? null,
        url: p.url ?? null,
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
