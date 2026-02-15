/** Supported source types for comment fetching */
export type CommentSourceType = 'reddit' | 'hackernews';

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

/** Supported Hacker News feed types */
export type HackerNewsFeedType = 'top' | 'new' | 'ask' | 'show' | 'jobs' | 'newcomments';

/** Union type for all comment source configurations */
export type CommentSource = RedditSource | HackerNewsSource;

/** Value Object: Comment Source Configuration */
export class CommentSourceValueObject {
  private constructor(
    public readonly type: CommentSourceType,
    public readonly redditUrl?: string,
    public readonly subredditName?: string,
    public readonly postId?: string,
    public readonly hnFeedType?: HackerNewsFeedType,
    public readonly hnUrl?: string,
    public readonly hnItemId?: string
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
      undefined
    );
  }

  /** Create Hacker News source */
  static createHackerNews(feedTypeOrUrl: HackerNewsFeedType | string): CommentSourceValueObject {
    // Check if it's a URL
    if (typeof feedTypeOrUrl === 'string' && feedTypeOrUrl.includes('news.ycombinator.com')) {
      return this.parseHackerNewsUrl(feedTypeOrUrl);
    }

    // Assume it's a feed type
    return new CommentSourceValueObject(
      'hackernews',
      undefined,
      undefined,
      undefined,
      feedTypeOrUrl as HackerNewsFeedType,
      undefined,
      undefined
    );
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
        itemId
      );
    } catch (error) {
      throw new Error(`Failed to parse Hacker News URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /** Parse Reddit URL to extract subreddit and post ID */
  private static parseRedditUrl(url: string): CommentSourceValueObject {
    try {
      // Remove protocol and www if present
      let cleanUrl = url.replace(/^https?:\/\//, '').replace(/^www\./, '');

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
        postId
      );
    } catch (error) {
      throw new Error(`Failed to parse Reddit URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    } else {
      return {
        type: 'hackernews',
        feedType: this.hnFeedType,
        url: this.hnUrl,
        itemId: this.hnItemId,
      };
    }
  }

  /** Get a unique identifier for this source configuration */
  getId(): string {
    if (this.type === 'reddit') {
      return `reddit:${this.redditUrl}`;
    } else {
      return this.hnUrl ? `hackernews:${this.hnUrl}` : `hackernews:${this.hnFeedType}`;
    }
  }

  /** Check if this is a Reddit post URL (vs subreddit) */
  isRedditPost(): boolean {
    return this.type === 'reddit' && !!this.postId;
  }

  /** Get display name for the source */
  getDisplayName(): string {
    if (this.type === 'reddit') {
      return this.subredditName || this.redditUrl || 'Reddit';
    } else {
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
    }
  }
}