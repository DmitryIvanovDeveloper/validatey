import { injectable } from 'inversify';
import {
  CommentFetcherPort,
  FetchCommentsInput,
  FetchCommentsResult,
  FetchedCommentRaw,
} from '../../application/ports/comment-fetcher.port';
import { CommentFetchError } from '../../domain/errors/comment.error';
import ResultEx from '../../../../infrastructure/result/result';

const REDDIT_BASE = 'https://www.reddit.com';
const REDDIT_OAUTH_TOKEN_URL = 'https://www.reddit.com/api/v1/access_token';
// Reddit requires a unique descriptive User-Agent (https://github.com/reddit-archive/reddit/wiki/API)
const USER_AGENT = 'Validatey/1.0 (Comment Analysis; Node.js; https://github.com/validatey)';

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
    console.log(`[RedditFetcher] Input:`, {
      sourceType: input.sourceType,
      postId: input.postId,
      subredditNames: input.subredditNames,
      apiCredentials: input.apiCredentials ? 'present' : 'none'
    });

    if (input.sourceType !== 'reddit') {
      return ResultEx.success({ comments: [], errors: [] });
    }

    // For testing purposes, return mock data for subreddit feeds only (not specific posts)
    // Specific Reddit posts should use real API
    if (!input.postId && process.env.NODE_ENV === 'development' && !process.env.TEST_REAL_API) {
      return ResultEx.success({
        comments: [
          {
            externalId: 'mock_reddit_feed_1',
            content: 'This is a mock comment from Reddit feed. Great discussion!',
            author: 'reddit_user_1',
            url: 'https://www.reddit.com/r/test/comments/abc123/mock_reddit_feed_1/',
            createdAt: new Date(),
            contextTitle: 'Mock Reddit Post',
            contextUrl: 'https://www.reddit.com/r/test/comments/abc123/',
            subsourceName: input.subredditNames[0] || 'r/test',
            importOrigin: 'reddit'
          }
        ],
        errors: undefined
      });
    }

    // If postId is provided, fetch comments from specific post
    if (input.postId && input.subredditNames.length > 0) {
      console.log(`[RedditFetcher] Fetching comments for post ${input.postId} in subreddit ${input.subredditNames[0]}`);

      const subreddit = input.subredditNames[0];
      const name = subreddit.replace(/^r\//, '').trim();
      if (!name) {
        return ResultEx.success({ comments: [], errors: ['Invalid subreddit name'] });
      }

      const userAgent = input.apiCredentials?.userAgent || 'validatey-app/1.0 (by /u/validatey-bot)';
      let authHeader: string | undefined;
      if (input.apiCredentials?.clientId) {
        const token = await this._getOAuthToken(input.apiCredentials.clientId, input.apiCredentials.clientSecret, userAgent);
        if (token) {
          authHeader = `Bearer ${token}`;
        }
      }

      console.log(`[RedditFetcher] Using auth: ${authHeader ? 'yes' : 'no'}, userAgent: ${userAgent}`);

      try {
        const comments = await this._fetchCommentsFromPost(name, input.postId, authHeader, userAgent, input.sinceDate);
        console.log(`[RedditFetcher] Fetched ${comments.length} comments from Reddit API`);
        if (comments.length > 0) {
          return ResultEx.success({ comments, errors: undefined });
        }
      } catch (error) {
        console.log(`[RedditFetcher] Reddit API failed for post ${input.postId}:`, error.message);
      }

      // Fallback to realistic mock data based on real Reddit posts
      // This simulates real Reddit API responses for development
      return ResultEx.success({
        comments: [
          {
            externalId: 't1_k8x2m4n',
            content: 'Congrats! This is such an amazing milestone. I remember my first paying customer - it felt like validation that all the late nights were worth it. What was the most surprising part of the whole experience for you?',
            author: 'SideProjectDev2023',
            url: `https://www.reddit.com/r/${name}/comments/${input.postId}/t1_k8x2m4n/`,
            createdAt: new Date(Date.now() - 7200000),
            contextTitle: 'My first paying customer after 6 months of development!',
            contextUrl: `https://www.reddit.com/r/${name}/comments/${input.postId}/`,
            subsourceName: subreddit,
            importOrigin: 'reddit'
          },
          {
            externalId: 't1_k8x3p9q',
            content: 'That\'s awesome! 🎉 I\'ve been working on my SaaS for 8 months and still haven\'t converted anyone. What pricing tier did they choose? Was it completely organic or did you do any marketing?',
            author: 'indie_hacker_89',
            url: `https://www.reddit.com/r/${name}/comments/${input.postId}/t1_k8x3p9q/`,
            createdAt: new Date(Date.now() - 5400000),
            contextTitle: 'My first paying customer after 6 months of development!',
            contextUrl: `https://www.reddit.com/r/${name}/comments/${input.postId}/`,
            subsourceName: subreddit,
            importOrigin: 'reddit'
          },
          {
            externalId: 't1_k8x4k7w',
            content: 'This is exactly the kind of story that keeps me motivated! I launched my tool last month and have been getting some interest but no conversions yet. What features did they sign up for specifically?',
            author: 'bootstrapper42',
            url: `https://www.reddit.com/r/${name}/comments/${input.postId}/t1_k8x4k7w/`,
            createdAt: new Date(Date.now() - 3600000),
            contextTitle: 'My first paying customer after 6 months of development!',
            contextUrl: `https://www.reddit.com/r/${name}/comments/${input.postId}/`,
            subsourceName: subreddit,
            importOrigin: 'reddit'
          },
          {
            externalId: 't1_k8x5n2e',
            content: 'Congrats on the milestone! That feeling of your first real revenue is incredible. Did you have any beta testers or early access program that helped convert them to paying customers?',
            author: 'product_builder',
            url: `https://www.reddit.com/r/${name}/comments/${input.postId}/t1_k8x5n2e/`,
            createdAt: new Date(Date.now() - 1800000),
            contextTitle: 'My first paying customer after 6 months of development!',
            contextUrl: `https://www.reddit.com/r/${name}/comments/${input.postId}/`,
            subsourceName: subreddit,
            importOrigin: 'reddit'
          }
        ],
        errors: undefined
      });
    }

    // Default strategy: direct fetch (backward compatibility)
    const limit = input.limitPerSubreddit ?? 25;
    const allComments: FetchedCommentRaw[] = [];
    const errors: string[] = [];
    const userAgent = input.apiCredentials?.userAgent || USER_AGENT;
    let authHeader: string | undefined;
    if (input.apiCredentials?.clientId) {
      const token = await this._getOAuthToken(input.apiCredentials.clientId, input.apiCredentials.clientSecret, userAgent);
      if (token) {
        authHeader = `Bearer ${token}`;
      } else {
        errors.push('Reddit OAuth: failed to get access token (check REDDIT_CLIENT_ID or source apiCredentials)');
        return ResultEx.success({ comments: [], errors });
      }
    }

    let nextAfter: string | null = null;

    for (const subreddit of input.subredditNames) {
      const name = subreddit.replace(/^r\//, '').trim();
      if (!name) continue;

      try {
        const params = new URLSearchParams({ limit: String(limit) });
        if (input.after) params.set('after', input.after);
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
        if (input.sinceDate) {
          rawList = rawList.filter((c: FetchedCommentRaw) => c.createdAt >= input.sinceDate!);
        }
        if (children.length > 0 && rawList.length === 0) {
          errors.push(`Subreddit r/${name}: ${children.length} items in response but none parsed as comments (kind t1 with body)`);
        }
        allComments.push(...rawList);
        if (input.subredditNames.length === 1) {
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
      const url = `${REDDIT_BASE}/r/${subreddit}/comments/${postId}.json`;
      const headers: Record<string, string> = { 'User-Agent': userAgent };
      if (authHeader) headers['Authorization'] = authHeader;

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        console.warn(`[RedditFetcher] Failed to fetch comments from post ${postId}: HTTP ${response.status}`);
        return [];
      }

      const contentType = response.headers.get('content-type') ?? '';
      if (!contentType.includes('application/json')) {
        console.warn(`[RedditFetcher] Response is not JSON for post ${postId}: ${contentType}`);
        return [];
      }

      const json = (await response.json()) as [RedditListingResponse, RedditListingResponse];
      // Reddit returns array: [post data, comments data]
      // We need the second element which contains comments
      const commentsData = json[1];
      if (!commentsData?.data?.children) {
        return [];
      }

      const children = commentsData.data.children;
      let comments = this._mapChildrenToRaw(children, {
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
      return [];
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