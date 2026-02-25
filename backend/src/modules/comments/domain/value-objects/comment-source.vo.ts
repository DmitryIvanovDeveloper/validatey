/** Supported source types for comment fetching */
export type CommentSourceType = 'reddit' | 'hackernews' | 'linkedin';

/** Reddit-specific configuration */
export interface RedditSource {
  readonly type: 'reddit';
  readonly url: string; // Full post URL or subreddit name
  readonly subredditName?: string; // Extracted subreddit name
  readonly postId?: string; // Extracted post ID (if URL is a post)
}

/** Hacker News-specific configuration */
export interface HackerNewsSource {
  readonly type: 'hackernews';
  readonly feedType?: HackerNewsFeedType;
  readonly url?: string; // Full post URL
  readonly itemId?: string; // HN item ID
}

/** LinkedIn-specific configuration */
export interface LinkedInSource {
  readonly type: 'linkedin';
  readonly url: string; // Full post URL
  readonly postId?: string; // Extracted post ID
}

/** Supported Hacker News feed types */
export type HackerNewsFeedType = 'top' | 'new' | 'ask' | 'show' | 'jobs' | 'newcomments';

/** Union type for all comment source configurations */
export type CommentSource = RedditSource | HackerNewsSource | LinkedInSource;

/** Value Object: Comment Source Configuration */
export class CommentSourceValueObject {
  private constructor(
    public readonly type: CommentSourceType,
    public readonly redditUrl?: string,
    public readonly subredditName?: string,
    public readonly postId?: string,
    public readonly hnFeedType?: HackerNewsFeedType,
    public readonly hnUrl?: string,
    public readonly hnItemId?: string,
    public readonly linkedinUrl?: string,
    public readonly linkedinPostId?: string
  ) {}

  /** Create Reddit source from URL or subreddit name */
  static createReddit(urlOrSubreddit: string): CommentSourceValueObject {
    if (!urlOrSubreddit || urlOrSubreddit.trim().length === 0) {
      throw new Error('Reddit URL or subreddit name is required');
    }

    const trimmed = urlOrSubreddit.trim();

    // Check if it's a full URL
    if (trimmed.includes('reddit.com')) {
      return this.parseRedditUrl(trimmed);
    }

    // Assume it's a subreddit name
    const subredditName = trimmed.startsWith('r/') ? trimmed : `r/${trimmed}`;
    return new CommentSourceValueObject(
      'reddit',
      subredditName,
      subredditName,
        undefined,
        undefined,
        undefined,
        undefined,
      undefined
    );
  }

  /** Create Reddit search source (auto-search by query via Reddit JSON API) */
  static createRedditSearch(query: string): CommentSourceValueObject {
    if (!query?.trim()) throw new Error('Reddit search query is required');
    return new CommentSourceValueObject(
      'reddit',
      `search:${query.trim()}`, // stored in redditUrl field
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined
    );
  }

  /** Create Reddit source with explicit postId and subredditName */
  static createRedditWithIds(redditUrl: string, postId: string, subredditName: string): CommentSourceValueObject {
    return new CommentSourceValueObject(
      'reddit',
      redditUrl,
      subredditName,
      postId,
      undefined,
      undefined,
      undefined,
      undefined
    );
  }

  /** Create Hacker News source (URL, feed type, or search query) */
  static createHackerNews(feedTypeOrUrl: HackerNewsFeedType | string): CommentSourceValueObject {
    if (typeof feedTypeOrUrl === 'string' && feedTypeOrUrl.startsWith('search:')) {
      const query = feedTypeOrUrl.slice(7).trim();
      if (!query) throw new Error('HN search query is required');
      return new CommentSourceValueObject(
        'hackernews',
        undefined,
        undefined,
        undefined,
        undefined,
        `search:${query}`,
        undefined,
        undefined,
        undefined
      );
    }
    if (typeof feedTypeOrUrl === 'string' && feedTypeOrUrl.includes('news.ycombinator.com')) {
      return this.parseHackerNewsUrl(feedTypeOrUrl);
    }
    return new CommentSourceValueObject(
      'hackernews',
      undefined,
      undefined,
      undefined,
      feedTypeOrUrl as HackerNewsFeedType,
      undefined,
      undefined,
      undefined,
      undefined
    );
  }

  /** Create LinkedIn source from URL */
  static createLinkedIn(url: string): CommentSourceValueObject {
    if (!url || url.trim().length === 0) {
      throw new Error('LinkedIn URL is required');
    }

    const trimmed = url.trim();

    // Check if it's a LinkedIn URL
    if (!trimmed.includes('linkedin.com')) {
      throw new Error('Invalid LinkedIn URL format');
    }

    return this.parseLinkedInUrl(trimmed);
  }

  /** Parse Hacker News URL to extract item ID */
  private static parseHackerNewsUrl(url: string): CommentSourceValueObject {
    try {
      // Remove protocol if present
      let cleanUrl = url.replace(/^https?:\/\//, '');

      // Expected format: news.ycombinator.com/item?id=123456
      const hnMatch = cleanUrl.match(/news\.ycombinator\.com\/item\?id=(\d+)/);

      if (!hnMatch) {
        throw new Error('Invalid Hacker News URL format');
      }

      const itemId = hnMatch[1];

      return new CommentSourceValueObject(
        'hackernews',
        undefined,
        undefined,
        undefined,
        undefined,
        url,
        itemId,
        undefined
      );
    } catch (error) {
      throw new Error(`Failed to parse Hacker News URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /** Parse Reddit URL to extract subreddit and post ID */
  private static parseRedditUrl(url: string): CommentSourceValueObject {
    try {
      // Remove protocol and normalize host (old.reddit.com -> reddit.com)
      let cleanUrl = url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/^old\.reddit\.com/, 'reddit.com');

      // Expected format: reddit.com/r/subreddit/comments/postId/title/
      const redditMatch = cleanUrl.match(/^reddit\.com\/r\/([^\/]+)\/comments\/([^\/]+)/);

      if (!redditMatch) {
        throw new Error('Invalid Reddit URL format');
      }

      const subredditName = `r/${redditMatch[1]}`;
      const postId = redditMatch[2];

      return new CommentSourceValueObject(
        'reddit',
        url,
        subredditName,
        postId,
        undefined,
        undefined,
        undefined,
        undefined
      );
    } catch (error) {
      throw new Error(`Failed to parse Reddit URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /** Parse LinkedIn URL to extract post ID */
  private static parseLinkedInUrl(url: string): CommentSourceValueObject {
    try {
      // Remove protocol if present
      let cleanUrl = url.replace(/^https?:\/\//, '').replace(/^www\./, '');

      // LinkedIn post URL formats:
      // - linkedin.com/feed/update/urn:li:activity:{postId}
      // - linkedin.com/feed/update/urn:li:groupPost:{groupId}-{postId}
      // - linkedin.com/posts/activity-{postId}
      // - linkedin.com/feed/update/{postId}
      const urnMatch = cleanUrl.match(/linkedin\.com\/feed\/update\/urn:li:(?:activity|groupPost):([^?]+)/);
      const simpleMatch = cleanUrl.match(/linkedin\.com\/(?:posts\/activity-|feed\/update\/|posts\/)([a-zA-Z0-9_-]+)/);

      const postId = urnMatch ? urnMatch[1] : (simpleMatch ? simpleMatch[1] : undefined);

      return new CommentSourceValueObject(
        'linkedin',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        url,
        postId
      );
    } catch (error) {
      throw new Error(`Failed to parse LinkedIn URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /** Get source configuration as data object */
  toData(): CommentSource {
    if (this.type === 'reddit') {
      return {
        type: 'reddit',
        url: this.redditUrl!,
        subredditName: this.subredditName,
        postId: this.postId,
      };
    } else if (this.type === 'hackernews') {
      return {
        type: 'hackernews',
        feedType: this.hnFeedType,
        url: this.hnUrl,
        itemId: this.hnItemId,
      };
    } else {
      return {
        type: 'linkedin',
        url: this.linkedinUrl!,
        postId: this.linkedinPostId,
      };
    }
  }

  /** Get a unique identifier for this source configuration */
  getId(): string {
    if (this.type === 'reddit') {
      return `reddit:${this.redditUrl}`;
    } else if (this.type === 'hackernews') {
      return this.hnUrl ? `hackernews:${this.hnUrl}` : `hackernews:${this.hnFeedType}`;
    } else {
      return `linkedin:${this.linkedinUrl}`;
    }
  }

  /** Check if this is a Reddit post URL (vs subreddit) */
  isRedditPost(): boolean {
    return this.type === 'reddit' && !!this.postId;
  }

  /** Get display name for the source */
  getDisplayName(): string {
    if (this.type === 'reddit') {
      if (this.redditUrl?.startsWith('search:')) return 'Reddit Search';
      return this.subredditName || this.redditUrl || 'Reddit';
    } else if (this.type === 'hackernews') {
      if (this.hnUrl?.startsWith('search:')) {
        return 'Hacker News Search';
      }
      if (this.hnUrl && this.hnItemId) {
        return `Hacker News Post #${this.hnItemId}`;
      }
      const feedNames: Record<HackerNewsFeedType, string> = {
        top: 'Top Stories',
        new: 'New Stories',
        ask: 'Ask HN',
        show: 'Show HN',
        jobs: 'Jobs',
        newcomments: 'New Comments',
      };
      return `Hacker News - ${feedNames[this.hnFeedType!]}`;
    } else {
      return this.postId ? `LinkedIn Post #${this.postId}` : (this.linkedinUrl || 'LinkedIn');
    }
  }
}