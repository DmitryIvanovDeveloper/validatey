import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import type { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import {
  CommentFetcherPort,
  FetchCommentsInput,
  FetchCommentsResult,
  FetchedCommentRaw,
} from '../../application/ports/comment-fetcher.port';
import { CommentFetchError } from '../../domain/errors/comment.error';
import ResultEx from '../../../../infrastructure/result/result';

const HN_ALGOLIA_BASE = 'https://hn.algolia.com/api/v1';
const HITS_PER_PAGE = 100;

interface HNAlgoliaHit {
  readonly objectID: string;
  readonly comment_text?: string | null;
  readonly author?: string | null;
  readonly created_at?: string | null;
  readonly story_title?: string | null;
  readonly story_url?: string | null;
  readonly story_id?: number | null;
}

interface HNAlgoliaResponse {
  readonly hits?: readonly HNAlgoliaHit[];
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

@injectable()
export class HackerNewsAlgoliaFetcher implements CommentFetcherPort {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(ROOT_TYPES.HttpClient)
    private readonly _http: HttpClientPort
  ) {}

  async fetch(input: FetchCommentsInput): Promise<ResultEx<FetchCommentsResult, CommentFetchError>> {
    const hnInput = input as FetchCommentsInput & { searchQuery?: string };
    if (hnInput.sourceType !== 'hackernews' || !hnInput.searchQuery?.trim()) {
      return ResultEx.success({ comments: [], errors: [] });
    }

    const query = hnInput.searchQuery.trim();
    this._logger.info('hn-algolia-fetcher.start', { query });

    try {
      const params = new URLSearchParams({
        query,
        tags: 'comment',
        hitsPerPage: String(HITS_PER_PAGE),
      });
      const url = `${HN_ALGOLIA_BASE}/search_by_date?${params.toString()}`;

      const response = await this._http.get<HNAlgoliaResponse>(url, {
        'User-Agent': 'Validatey/1.0 (research@validatey.com)',
      });

      const hits = response?.hits ?? [];
      const comments: FetchedCommentRaw[] = [];

      for (const hit of hits) {
        const text = hit.comment_text?.trim();
        if (!text) continue;

        const storyUrl =
          hit.story_url ?? (hit.story_id ? `https://news.ycombinator.com/item?id=${hit.story_id}` : null);
        const commentUrl = `https://news.ycombinator.com/item?id=${hit.objectID}`;

        comments.push({
          externalId: hit.objectID,
          content: stripHtml(text),
          author: hit.author ?? null,
          url: commentUrl,
          contextTitle: hit.story_title ?? null,
          contextUrl: storyUrl ?? commentUrl,
          createdAt: hit.created_at ? new Date(hit.created_at) : new Date(),
        });
      }

      this._logger.info('hn-algolia-fetcher.success', { query, count: comments.length });

      return ResultEx.success({
        comments,
        errors: undefined,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this._logger.warn('hn-algolia-fetcher.error', { query, error: message });
      return ResultEx.success({
        comments: [],
        errors: [message],
      });
    }
  }
}
