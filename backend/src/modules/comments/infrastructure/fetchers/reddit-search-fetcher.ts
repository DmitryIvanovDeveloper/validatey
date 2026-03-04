import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import type { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import {
  CommentFetcherPort,
  FetchCommentsInput,
  FetchCommentsInputReddit,
  FetchCommentsResult,
  FetchedCommentRaw,
} from '../../application/ports/comment-fetcher.port';
import { CommentFetchError } from '../../domain/errors/comment.error';
import ResultEx from '../../../../infrastructure/result/result';

const REDDIT_BASE = 'https://www.reddit.com';
const HITS_PER_PAGE = 100;
/**
 * Minimal fallback subreddits used only when FetchCommentsUseCase fails to provide
 * AI-suggested ones. Keep generic so any topic finds something.
 */
const FALLBACK_SUBREDDITS = [
  'startups',
  'SaaS',
  'Entrepreneur',
  'productivity',
  'software',
];

const USER_AGENT = 'web:com.validatey.comments:v1.0.0 (by /u/validatey_bot)';
const MIN_COMMENT_LENGTH = 30;

interface RedditSearchChild {
  readonly kind: string; // 't1' = comment, 't3' = post
  readonly data: {
    readonly id: string;
    readonly body?: string;     // comment text (t1)
    readonly selftext?: string; // post body text (t3)
    readonly title?: string;    // post title (t3)
    readonly author?: string;
    readonly created_utc?: number;
    readonly permalink?: string;
    readonly link_title?: string;
    readonly link_url?: string;
    readonly url?: string;
    readonly subreddit?: string;
  };
}

interface RedditSearchResponse {
  readonly data?: {
    readonly children?: readonly RedditSearchChild[];
    readonly after?: string | null;
  };
  readonly error?: number;
  readonly message?: string;
}

@injectable()
export class RedditSearchFetcher implements CommentFetcherPort {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(ROOT_TYPES.HttpClient)
    private readonly _http: HttpClientPort
  ) {}

  async fetch(input: FetchCommentsInput): Promise<ResultEx<FetchCommentsResult, CommentFetchError>> {
    const redditInput = input as FetchCommentsInputReddit;
    if (redditInput.sourceType !== 'reddit' || !redditInput.searchQuery?.trim()) {
      return ResultEx.success({ comments: [], errors: [] });
    }

    const query = redditInput.searchQuery.trim();
    const subreddits = redditInput.subreddits && redditInput.subreddits.length > 0
      ? redditInput.subreddits
      : FALLBACK_SUBREDDITS;

    this._logger.info('reddit-search-fetcher.start', { query, subreddits: subreddits.length });

    try {
      // Search within specified subreddits using restrict_sr=on
      // type=comment,link returns both comments (t1) and posts (t3) which contain discussion text.
      const subredditList = subreddits.join('+');
      const params = new URLSearchParams({
        q: query,
        sort: 'relevance',
        t: 'year',
        limit: String(HITS_PER_PAGE),
      });

      const url = `${REDDIT_BASE}/r/${subredditList}/search.json?${params.toString()}&restrict_sr=on`;

      const response = await this._http.get<RedditSearchResponse>(url, {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      });

      if (response?.error) {
        this._logger.warn('reddit-search-fetcher.api-error', { query, error: response.message });
        return ResultEx.success({ comments: [], errors: [response.message ?? 'Reddit API error'] });
      }

      const children = response?.data?.children ?? [];
      this._logger.info('reddit-search-fetcher.api-response', { query, returned: children.length });

      const comments: FetchedCommentRaw[] = [];

      for (const child of children) {
        const permalink = child.data.permalink
          ? `${REDDIT_BASE}${child.data.permalink}`
          : `${REDDIT_BASE}/comments/${child.data.id}`;
        const author = child.data.author && child.data.author !== '[deleted]' ? child.data.author : null;
        const createdAt = child.data.created_utc ? new Date(child.data.created_utc * 1000) : new Date();

        if (child.kind === 't1') {
          // Comment
          const body = child.data.body?.trim();
          if (!body || body === '[deleted]' || body === '[removed]') continue;
          if (body.length < MIN_COMMENT_LENGTH) continue;

          comments.push({
            externalId: `reddit_c_${child.data.id}`,
            content: body,
            author,
            url: permalink,
            contextTitle: child.data.link_title ?? null,
            contextUrl: child.data.link_url ?? permalink,
            createdAt,
          });
        } else if (child.kind === 't3') {
          // Post — use selftext as content if it exists and is substantive
          const selftext = child.data.selftext?.trim();
          if (!selftext || selftext === '[deleted]' || selftext === '[removed]') continue;
          if (selftext.length < MIN_COMMENT_LENGTH) continue;

          const title = child.data.title?.trim() ?? '';
          comments.push({
            externalId: `reddit_p_${child.data.id}`,
            content: title ? `${title}\n\n${selftext}` : selftext,
            author,
            url: permalink,
            contextTitle: title || null,
            contextUrl: permalink,
            createdAt,
          });
        }
      }

      this._logger.info('reddit-search-fetcher.success', { query, count: comments.length });

      return ResultEx.success({ comments, errors: undefined });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this._logger.warn('reddit-search-fetcher.error', { query, error: message });
      // Return empty success — Reddit search failure must not block the whole pipeline
      return ResultEx.success({ comments: [], errors: [message] });
    }
  }
}
