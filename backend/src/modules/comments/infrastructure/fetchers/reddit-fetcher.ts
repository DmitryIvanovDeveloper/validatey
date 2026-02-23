import { injectable } from 'inversify';
import {
  CommentFetcherPort,
  FetchCommentsInput,
  FetchCommentsInputReddit,
  FetchCommentsResult,
  FetchedCommentRaw,
} from '../../application/ports/comment-fetcher.port';
import { CommentFetchError } from '../../domain/errors/comment.error';
import ResultEx from '../../../../infrastructure/result/result';
import { launchPuppeteer } from '../../../../infrastructure/puppeteer/puppeteer-launcher';

const REDDIT_BASE = 'https://www.reddit.com';
const OLD_REDDIT_BASE = 'https://old.reddit.com';
const PUPPETEER_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const REDDIT_OAUTH_TOKEN_URL = 'https://www.reddit.com/api/v1/access_token';
// Reddit requires a unique descriptive User-Agent in format: <platform>:<appId>:<version> (by /u/<username>)
// See: https://github.com/reddit-archive/reddit/wiki/API
const USER_AGENT = 'web:com.validatey.comments:v1.0.0 (by /u/validatey_bot)';

/** Reddit can return replies as empty string or as a Listing with children */
interface RedditRepliesListing {
  kind?: string;
  data?: { children?: RedditListingChild[] };
}

interface RedditListingChild {
  kind: string;
  data: {
    id: string;
    body?: string;
    selftext?: string;
    author?: string;
    created_utc?: number;
    created?: number;
    permalink?: string;
    link_title?: string;
    link_url?: string;
    url?: string;
    title?: string;
    replies?: string | RedditRepliesListing;
  };
}

interface RedditListingResponse {
  kind?: string;
  error?: number;
  message?: string;
  data?: {
    children?: RedditListingChild[];
    /** Fullname for next page (e.g. t1_xxx) */
    after?: string | null;
  };
}

@injectable()
export class RedditFetcher implements CommentFetcherPort {
  public async fetch(input: FetchCommentsInput): Promise<ResultEx<FetchCommentsResult, CommentFetchError>> {
    const redditInput = input as FetchCommentsInputReddit;

    console.log(`[RedditFetcher] Input:`, {
      sourceType: redditInput.sourceType,
      postId: redditInput.postId,
      subredditNames: redditInput.subredditNames,
      apiCredentials: redditInput.apiCredentials ? 'present' : 'none'
    });

    // If postId is provided, fetch comments from specific post
    // Try to extract subreddit from postId URL pattern if subredditNames is empty
    let subredditNames = redditInput.subredditNames;
    if (redditInput.postId && subredditNames.length === 0) {
      // Try to extract subreddit from a Reddit URL if available in input
      // This is a fallback for cases where subredditName wasn't extracted from source
      console.log(`[RedditFetcher] postId provided but subredditNames is empty, attempting to extract from postId pattern`);
      // PostId format is usually just the ID, but we can't extract subreddit from it
      // So we'll skip the post-specific fetch and use default strategy
      console.log(`[RedditFetcher] Cannot extract subreddit from postId alone, will use default fetch strategy`);
    }

    if (redditInput.postId && subredditNames.length > 0) {
      console.log(`[RedditFetcher] Fetching comments for post ${redditInput.postId} in subreddit ${redditInput.subredditNames[0]}`);

      const subreddit = redditInput.subredditNames[0];
      const name = subreddit.replace(/^r\//, '').trim();
      if (!name) {
        return ResultEx.success({ comments: [], errors: ['Invalid subreddit name'] });
      }

      const userAgent = redditInput.apiCredentials?.userAgent || USER_AGENT;
      let authHeader: string | undefined;
      if (redditInput.apiCredentials?.clientId) {
        const token = await this._getOAuthToken(redditInput.apiCredentials.clientId, redditInput.apiCredentials.clientSecret, userAgent);
        if (token) {
          authHeader = `Bearer ${token}`;
        }
      }

      console.log(`[RedditFetcher] Using auth: ${authHeader ? 'yes' : 'no'}, userAgent: ${userAgent}`);

      let comments: FetchedCommentRaw[] = [];
      let apiError: string | undefined;
      let apiSucceeded = false;
      try {
        comments = await this._fetchCommentsFromPost(name, redditInput.postId, authHeader, userAgent, redditInput.sinceDate);
        apiSucceeded = true;
        console.log(`[RedditFetcher] Fetched ${comments.length} comments from Reddit API`);
      } catch (error) {
        apiError = error instanceof Error ? error.message : String(error);
        console.log(`[RedditFetcher] Reddit API failed for post ${redditInput.postId}:`, apiError);
      }

      // Fallback to Puppeteer if:
      // 1. API failed (apiError exists), OR
      // 2. API succeeded but returned 0 comments (likely blocked or empty response)
      if (comments.length === 0 && (apiError || !apiSucceeded || !redditInput.apiCredentials?.clientId)) {
        console.log(`[RedditFetcher] Falling back to Puppeteer scrape for post ${redditInput.postId} (API: ${apiError ? 'failed' : 'returned 0 comments'})`);
        console.log(`[RedditFetcher] Environment check: VERCEL=${process.env.VERCEL}, AWS_LAMBDA=${process.env.AWS_LAMBDA_FUNCTION_NAME}`);
        try {
          const postUrl = `${REDDIT_BASE}/r/${name}/comments/${redditInput.postId}`;
          console.log(`[RedditFetcher] Starting Puppeteer scrape for: ${postUrl}`);
          const puppeteerStartTime = Date.now();
          comments = await this._fetchCommentsWithPuppeteer(name, redditInput.postId, postUrl, redditInput.sinceDate);
          const puppeteerDuration = Date.now() - puppeteerStartTime;
          console.log(`[RedditFetcher] Puppeteer scrape completed in ${Math.round(puppeteerDuration / 1000)}s, found ${comments.length} comments`);
          if (comments.length > 0) {
            console.log(`[RedditFetcher] Puppeteer fallback: scraped ${comments.length} comments`);
            return ResultEx.success({
              comments,
              errors: apiError ? [`Reddit API failed (${apiError}); used browser scrape.`] : ['Reddit API returned 0 comments; used browser scrape.'],
            });
          } else {
            console.warn(`[RedditFetcher] Puppeteer fallback also returned 0 comments`);
          }
        } catch (puppeteerErr) {
          const errorMsg = puppeteerErr instanceof Error ? puppeteerErr.message : String(puppeteerErr);
          const errorStack = puppeteerErr instanceof Error ? puppeteerErr.stack : undefined;
          console.error(`[RedditFetcher] Puppeteer fallback failed: ${errorMsg}`, errorStack ? `\nStack: ${errorStack}` : '');
        }
      }

      if (comments.length > 0) {
        return ResultEx.success({ comments, errors: undefined });
      }
      return ResultEx.success({
        comments: [],
        errors: [apiError ?? `Failed to fetch post ${redditInput.postId}`],
      });
    }

    // Default strategy: direct fetch (backward compatibility)
    const limit = redditInput.limitPerSubreddit ?? 25;
    const allComments: FetchedCommentRaw[] = [];
    const errors: string[] = [];
    const userAgent = redditInput.apiCredentials?.userAgent || USER_AGENT;
    let authHeader: string | undefined;
    if (redditInput.apiCredentials?.clientId) {
      const token = await this._getOAuthToken(redditInput.apiCredentials.clientId, redditInput.apiCredentials.clientSecret, userAgent);
      if (token) {
        authHeader = `Bearer ${token}`;
      } else {
        errors.push('Reddit OAuth: failed to get access token (check REDDIT_CLIENT_ID or source apiCredentials)');
        return ResultEx.success({ comments: [], errors });
      }
    }

    let nextAfter: string | null = null;

    for (const subreddit of redditInput.subredditNames) {
      const name = subreddit.replace(/^r\//, '').trim();
      if (!name) continue;

      try {
        const params = new URLSearchParams({ limit: String(limit) });
        if (redditInput.after) params.set('after', redditInput.after);
        const url = `${REDDIT_BASE}/r/${name}/comments.json?${params.toString()}`;
        const headers: Record<string, string> = { 'User-Agent': userAgent };
        if (authHeader) headers['Authorization'] = authHeader;
        const response = await fetch(url, {
          method: 'GET',
          headers,
        });

        const text = await response.text();
        if (!response.ok) {
          errors.push(`Subreddit r/${name}: HTTP ${response.status} (Reddit may block server-side requests; use OAuth2 API for production)`);
          continue;
        }

        const contentType = response.headers.get('content-type') ?? '';
        if (!contentType.includes('application/json')) {
          errors.push(`Subreddit r/${name}: response is not JSON (got ${contentType})`);
          continue;
        }

        let json: RedditListingResponse;
        try {
          json = JSON.parse(text) as RedditListingResponse;
        } catch (parseErr) {
          errors.push(`Subreddit r/${name}: invalid JSON response`);
          continue;
        }

        if (json.error != null || json.message) {
          errors.push(`Subreddit r/${name}: Reddit API error ${json.error ?? ''} ${json.message ?? ''}`.trim());
          continue;
        }

        const children = json?.data?.children ?? [];
        let rawList = this._mapChildrenToRaw(children, input);
        if (redditInput.sinceDate) {
          rawList = rawList.filter((c: FetchedCommentRaw) => c.createdAt >= redditInput.sinceDate!);
        }
        if (children.length > 0 && rawList.length === 0) {
          errors.push(`Subreddit r/${name}: ${children.length} items in response but none parsed as comments (kind t1 with body)`);
        }
        allComments.push(...rawList);
        if (redditInput.subredditNames.length === 1) {
          nextAfter = json?.data?.after ?? null;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Subreddit r/${name}: ${msg}`);
      }
    }

    return ResultEx.success({
      comments: allComments,
      errors: errors.length > 0 ? errors : undefined,
      nextAfter: nextAfter ?? undefined,
    });
  }

  /**
   * Reddit application-only OAuth2 (no user password).
   * Requires app at https://www.reddit.com/prefs/apps (type "installed" or "script").
   * Returns access_token or null on failure.
   */
  private async _getOAuthToken(
    clientId: string,
    clientSecret: string | undefined,
    userAgent: string
  ): Promise<string | null> {
    try {
      const credentials = Buffer.from(`${clientId}:${clientSecret ?? ''}`).toString('base64');
      const body = new URLSearchParams({
        grant_type: 'https://oauth.reddit.com/grants/installed_client',
        device_id: 'DO_NOT_TRACK_THIS_DEVICE',
      }).toString();
      const response = await fetch(REDDIT_OAUTH_TOKEN_URL, {
        method: 'POST',
        headers: {
          'User-Agent': userAgent,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`,
        },
        body,
      });
      if (!response.ok) {
        const text = await response.text();
        console.warn('[RedditFetcher] OAuth token failed:', response.status, text.slice(0, 200));
        return null;
      }
      const json = (await response.json()) as { access_token?: string };
      return json.access_token ?? null;
    } catch (err) {
      console.warn('[RedditFetcher] OAuth token error:', err);
      return null;
    }
  }

  /**
   * Fetch comments from a specific Reddit post
   */
  private async _fetchCommentsFromPost(
    subreddit: string,
    postId: string,
    authHeader: string | undefined,
    userAgent: string,
    sinceDate?: Date
  ): Promise<FetchedCommentRaw[]> {
    try {
      const url = `${REDDIT_BASE}/r/${subreddit}/comments/${postId}.json?limit=500`;
      const headers: Record<string, string> = { 'User-Agent': userAgent };
      if (authHeader) headers['Authorization'] = authHeader;

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const body = await response.text();
        console.warn(`[RedditFetcher] Failed to fetch comments from post ${postId}: HTTP ${response.status}`, body.slice(0, 200));
        const msg =
          response.status === 403
            ? 'Reddit API returned 403 (blocked). Set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET in .env for OAuth.'
            : `HTTP ${response.status}`;
        throw new Error(msg);
      }

      const contentType = response.headers.get('content-type') ?? '';
      if (!contentType.includes('application/json')) {
        const body = await response.text();
        console.warn(`[RedditFetcher] Response is not JSON for post ${postId}: ${contentType}`, body.slice(0, 200));
        throw new Error('Reddit response is not JSON (often 403 block). Set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET for OAuth.');
      }

      const json = (await response.json()) as [RedditListingResponse, RedditListingResponse];
      // Reddit returns array: [post data, comments data]
      // We need the second element which contains comments
      const commentsData = json[1];
      if (!commentsData?.data?.children) {
        return [];
      }

      const children = commentsData.data.children;
      const flatChildren = this._flattenCommentTree(children);
      let comments = this._mapChildrenToRaw(flatChildren, {
        sourceType: 'reddit',
        subredditNames: [subreddit],
        postId,
      });

      // Also get post title from first element
      const postData = json[0]?.data?.children?.[0]?.data;
      const postTitle = postData?.title ?? null;
      const postUrl = postData?.url ?? null;
      const postPermalink = postData?.permalink ?? null;
      const contextUrl = postPermalink
        ? (postPermalink.startsWith('http') ? postPermalink : `${REDDIT_BASE}${postPermalink}`)
        : postUrl;

      // Update comments with post context
      comments = comments.map(c => ({
        ...c,
        contextTitle: postTitle ?? c.contextTitle,
        contextUrl: contextUrl ?? c.contextUrl,
      }));

      if (sinceDate) {
        comments = comments.filter((c: FetchedCommentRaw) => c.createdAt >= sinceDate);
      }

      return comments;
    } catch (err) {
      console.warn(`[RedditFetcher] Error fetching comments from post ${postId}:`, err);
      throw err;
    }
  }

  /**
   * Reddit returns comments as a tree (each node has optional replies).
   * Flatten to a single array of all t1 (comment) nodes for mapping.
   */
  private _flattenCommentTree(children: RedditListingChild[]): RedditListingChild[] {
    const out: RedditListingChild[] = [];
    for (const child of children) {
      if (child.kind === 't1') {
        out.push(child);
        const replies = child.data?.replies;
        if (replies && typeof replies === 'object' && replies.data?.children?.length) {
          out.push(...this._flattenCommentTree(replies.data.children));
        }
      }
    }
    return out;
  }

  /**
   * Fallback: scrape comments from old.reddit.com with Puppeteer when API returns 403 or fails.
   */
  private async _fetchCommentsWithPuppeteer(
    subreddit: string,
    postId: string,
    postContextUrl: string,
    sinceDate?: Date
  ): Promise<FetchedCommentRaw[]> {
    const url = `${OLD_REDDIT_BASE}/r/${subreddit}/comments/${postId}/`;
    const browser = await launchPuppeteer();
    try {
      const page = await browser.newPage();
      await page.setUserAgent(PUPPETEER_USER_AGENT);
      await page.setDefaultNavigationTimeout(30000);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise((r) => setTimeout(r, 2000));

      const scraped = await page.evaluate(() => {
        const result: { externalId: string; content: string; author: string | null; permalink: string; createdAt: string }[] = [];
        // @ts-ignore - document is available in browser context
        const things = document.querySelectorAll('div.thing[data-fullname^="t1_"]');
        // @ts-ignore - Element type is available in browser context
        things.forEach((el: any) => {
          const fullname = el.getAttribute('data-fullname') || '';
          const externalId = fullname.replace(/^t1_/, '');
          const authorEl = el.querySelector('a.author');
          const author = authorEl?.textContent?.trim() || null;
          const usertextBody = el.querySelector('.usertext-body');
          const content = usertextBody?.querySelector('.md')?.textContent?.trim() || usertextBody?.textContent?.trim() || '';
          const timeEl = el.querySelector('time');
          const createdAt = timeEl?.getAttribute('datetime') || new Date().toISOString();
          const permalinkEl = el.querySelector('a.bylink');
          let permalink = permalinkEl?.getAttribute('href') || '';
          if (permalink && !permalink.startsWith('http')) permalink = 'https://old.reddit.com' + permalink;
          if (!content && el.querySelector('.deleted')) return;
          result.push({ externalId, content: content.slice(0, 10000), author, permalink, createdAt });
        });
        return result;
      });

      const comments: FetchedCommentRaw[] = scraped.map((c) => ({
        externalId: c.externalId,
        content: c.content || '[empty]',
        author: c.author,
        url: c.permalink,
        contextTitle: null,
        contextUrl: postContextUrl,
        createdAt: new Date(c.createdAt),
      }));

      if (sinceDate) {
        return comments.filter((c) => c.createdAt >= sinceDate);
      }
      return comments;
    } finally {
      await browser.close();
    }
  }

  private _mapChildrenToRaw(children: RedditListingChild[], input: FetchCommentsInput): FetchedCommentRaw[] {
    const result: FetchedCommentRaw[] = [];
    for (const child of children) {
      if (child.kind !== 't1') continue; // t1 = comment
      const d = child.data;
      const body = d.body ?? d.selftext ?? '';
      if (!body.trim()) continue;
      const permalink = d.permalink ?? '';
      const url = permalink.startsWith('http') ? permalink : `${REDDIT_BASE}${permalink}`;
      const createdUtc = d.created_utc ?? d.created;
      result.push({
        externalId: d.id,
        content: body,
        author: d.author ?? null,
        url,
        contextTitle: d.link_title ?? d.title ?? null,
        contextUrl: d.link_url ?? d.url ?? null,
        createdAt: createdUtc ? new Date(createdUtc * 1000) : new Date(),
      });
    }
    return result;
  }
}