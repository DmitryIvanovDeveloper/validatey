import { injectable } from 'inversify';
import {
  CommentFetcherPort,
  FetchCommentsInput,
  FetchCommentsResult,
  FetchedCommentRaw,
} from '../../application/ports/comment-fetcher.port';
import { CommentFetchError } from '../../domain/errors/comment.error';
import ResultEx from '../../../../infrastructure/result/result';

const HN_BASE = 'https://hacker-news.firebaseio.com/v0';
const HN_ITEM_URL = 'https://news.ycombinator.com/item?id=';
/** When sinceDate is set, walk backwards from maxitem to get comments in date range (covers full period, e.g. 30 days). */
const MAXITEM_WALK_SCAN_LIMIT = 100_000;
const MAXITEM_WALK_DELAY_MS = 25;
/** Stop when this many consecutive items are older than sinceTs (period boundary passed). */
const CONSECUTIVE_OLD_THRESHOLD = 500;

const FEED_ENDPOINTS: Record<string, string> = {
  top: 'topstories',
  new: 'newstories',
  ask: 'askstories',
  show: 'showstories',
  jobs: 'jobstories',
  newcomments: 'updates', // uses /v0/updates.json -> items[] (recent item IDs)
};

interface HNItem {
  id?: number;
  type?: string;
  by?: string;
  time?: number;
  text?: string;
  kids?: number[];
  title?: string;
  url?: string;
  parent?: number;
}

@injectable()
export class HackerNewsFetcher implements CommentFetcherPort {
  public async fetch(input: FetchCommentsInput): Promise<ResultEx<FetchCommentsResult, CommentFetchError>> {
    console.log(`[HN Fetcher] Fetch called with input:`, JSON.stringify(input, null, 2));

    if (input.sourceType !== 'hackernews') {
      return ResultEx.success({ comments: [], errors: [] });
    }

    const limitStories = input.limitStories ?? 30;
    const sinceDate = input.sinceDate;
    const sinceTs = sinceDate ? Math.floor(sinceDate.getTime() / 1000) : undefined;
    const allComments: FetchedCommentRaw[] = [];
    const errors: string[] = [];

    // Handle specific HN post
    if (input.itemId) {
      console.log(`[HN Fetcher] Fetching comments for specific post: ${input.itemId}`);
      return await this._fetchCommentsForPost(input.itemId);
    }

    try {
      // When sinceDate is set (e.g. "last 30 days"), walk backwards from maxitem to get comments in the full date range.
      // Story feeds and updates.json only contain recent items, so they cluster in the last week.
      if (sinceDate != null && sinceTs != null) {
        const byDate = await this._fetchCommentsByMaxItemWalk(sinceDate, sinceTs, allComments, errors);
        return ResultEx.success({
          comments: byDate.comments,
          errors: byDate.errors.length > 0 ? byDate.errors : undefined,
        });
      }

      if (input.feedType === 'newcomments') {
        const updated = await this._fetchNewComments(limitStories, sinceDate, sinceTs, allComments, errors);
        return ResultEx.success({
          comments: updated.comments,
          errors: updated.errors.length > 0 ? updated.errors : undefined,
        });
      }

      const endpoint = FEED_ENDPOINTS[input.feedType!] ?? 'topstories';
      const listRes = await fetch(`${HN_BASE}/${endpoint}.json`);
      if (!listRes.ok) {
        errors.push(`Hacker News: HTTP ${listRes.status} fetching ${endpoint}`);
        return ResultEx.success({ comments: [], errors });
      }
      const storyIds = (await listRes.json()) as number[];
      if (!Array.isArray(storyIds)) {
        errors.push('Hacker News: invalid response (not array)');
        return ResultEx.success({ comments: [], errors });
      }

      const toFetch = storyIds.slice(0, Math.min(limitStories, storyIds.length));
      for (let i = 0; i < toFetch.length; i++) {
        const storyId = toFetch[i];
        const story = await this._fetchItem(storyId);
        if (!story || story.type !== 'story') continue;
        if (sinceTs != null && (story.time == null || story.time < sinceTs)) continue;

        const contextTitle = story.title ?? null;
        const contextUrl = story.url ?? `${HN_ITEM_URL}${storyId}`;

        const kids = story.kids ?? [];
        for (const kidId of kids) {
          const collected = await this._fetchCommentRecursive(kidId, contextTitle, contextUrl, 0, sinceDate);
          for (const commentRaw of collected) {
            if (sinceDate == null || commentRaw.createdAt >= sinceDate) {
              allComments.push(commentRaw);
            }
          }
        }

        if (i < toFetch.length - 1) {
          await this._delay(100);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Hacker News: ${msg}`);
    }

    return ResultEx.success({
      comments: allComments,
      errors: errors.length > 0 ? errors : undefined,
    });
  }

  /**
   * Fetch recent comments from /v0/updates (items that changed recently).
   * Mimics https://news.ycombinator.com/newcomments
   */
  private async _fetchNewComments(
    limitComments: number,
    sinceDate: Date | undefined,
    sinceTs: number | undefined,
    allComments: FetchedCommentRaw[],
    errors: string[]
  ): Promise<{ comments: FetchedCommentRaw[]; errors: string[] }> {
    const listRes = await fetch(`${HN_BASE}/updates.json`);
    if (!listRes.ok) {
      errors.push(`Hacker News: HTTP ${listRes.status} fetching updates`);
      return { comments: allComments, errors };
    }
    let raw: unknown;
    try {
      raw = await listRes.json();
    } catch {
      errors.push('Hacker News: invalid JSON from updates');
      return { comments: allComments, errors };
    }
    const itemIds = Array.isArray((raw as { items?: number[] })?.items)
      ? (raw as { items: number[] }).items
      : Array.isArray(raw)
        ? (raw as number[])
        : [];
    const toProcess = itemIds.slice(0, Math.min(limitComments * 3, itemIds.length)); // fetch more IDs since many are stories
    for (let i = 0; i < toProcess.length && allComments.length < limitComments; i++) {
      const itemId = toProcess[i];
      const item = await this._fetchItem(itemId);
      if (!item || item.type !== 'comment') continue;
      if (sinceTs != null && (item.time == null || item.time < sinceTs)) continue;
      const text = item.text ?? '';
      if (!text.trim()) continue;
      const context = await this._resolveCommentContext(item.parent);
      const url = `${HN_ITEM_URL}${itemId}`;
      const createdAt = item.time ? new Date(item.time * 1000) : new Date();
      if (sinceDate != null && createdAt < sinceDate) continue;
      allComments.push({
        externalId: String(itemId),
        content: this._stripHtml(text),
        author: item.by ?? null,
        url,
        contextTitle: context.title,
        contextUrl: context.url,
        createdAt,
      });
      await this._delay(50);
    }
    return { comments: allComments, errors };
  }

  /**
   * Walk backwards from maxitem, collect comments with time >= sinceTs.
   * Covers the full date range (e.g. last 30 days); story feeds only contain recent items.
   */
  private async _fetchCommentsByMaxItemWalk(
    sinceDate: Date,
    sinceTs: number,
    allComments: FetchedCommentRaw[],
    errors: string[]
  ): Promise<{ comments: FetchedCommentRaw[]; errors: string[] }> {
    let maxId: number;
    try {
      const res = await fetch(`${HN_BASE}/maxitem.json`);
      if (!res.ok) {
        errors.push(`Hacker News: HTTP ${res.status} fetching maxitem`);
        return { comments: allComments, errors };
      }
      maxId = (await res.json()) as number;
      if (typeof maxId !== 'number' || maxId < 1) {
        errors.push('Hacker News: invalid maxitem response');
        return { comments: allComments, errors };
      }
    } catch (err) {
      errors.push(`Hacker News: ${err instanceof Error ? err.message : String(err)}`);
      return { comments: allComments, errors };
    }

    let scanned = 0;
    let consecutiveOld = 0;
    let id = maxId;
    while (scanned < MAXITEM_WALK_SCAN_LIMIT && id > 0 && consecutiveOld < CONSECUTIVE_OLD_THRESHOLD) {
      const currentId = id;
      const item = await this._fetchItem(id);
      await this._delay(MAXITEM_WALK_DELAY_MS);
      scanned++;
      id--;
      if (!item) continue;
      if (item.type !== 'comment') continue;
      if (item.time == null || item.time < sinceTs) {
        consecutiveOld++;
        continue;
      }
      consecutiveOld = 0;
      const text = item.text ?? '';
      if (!text.trim()) continue;
      let context: { title: string | null; url: string | null };
      try {
        context = await this._resolveCommentContext(item.parent);
      } catch {
        context = { title: null, url: null };
      }
      const url = `${HN_ITEM_URL}${currentId}`;
      const createdAt = new Date((item.time ?? 0) * 1000);
      if (createdAt < sinceDate) continue;
      allComments.push({
        externalId: String(currentId),
        content: this._stripHtml(text),
        author: item.by ?? null,
        url,
        contextTitle: context.title,
        contextUrl: context.url,
        createdAt,
      });
    }

    return { comments: allComments, errors };
  }

  private async _resolveCommentContext(parentId: number | undefined): Promise<{ title: string | null; url: string | null }> {
    if (parentId == null) return { title: null, url: null };
    const parent = await this._fetchItem(parentId);
    if (!parent) return { title: null, url: null };
    if (parent.type === 'story') {
      return {
        title: parent.title ?? null,
        url: parent.url ? parent.url : `${HN_ITEM_URL}${parentId}`,
      };
    }
    if (parent.type === 'comment' && parent.parent != null) {
      return this._resolveCommentContext(parent.parent);
    }
    return { title: null, url: null };
  }

  private async _fetchItem(id: number): Promise<HNItem | null> {
    try {
      const res = await fetch(`${HN_BASE}/item/${id}.json`);
      if (!res.ok) return null;
      return (await res.json()) as HNItem;
    } catch {
      return null;
    }
  }

  /**
   * Fetches one comment and all its nested replies (up to depth 5).
   * Returns array so we don't miss nested comments.
   */
  private async _fetchCommentRecursive(
    id: number,
    contextTitle: string | null,
    contextUrl: string | null,
    depth = 0,
    sinceDate: Date | undefined = undefined
  ): Promise<FetchedCommentRaw[]> {
    if (depth > 5) return [];
    const item = await this._fetchItem(id);
    if (!item || item.type !== 'comment') return [];

    const text = item.text ?? '';
    if (!text.trim()) return [];

    const url = `${HN_ITEM_URL}${id}`;
    const createdAt = item.time ? new Date(item.time * 1000) : new Date();
    const comment: FetchedCommentRaw = {
      externalId: String(id),
      content: this._stripHtml(text),
      author: item.by ?? null,
      url,
      contextTitle,
      contextUrl,
      createdAt,
    };

    const out: FetchedCommentRaw[] = [comment];

    const kids = item.kids ?? [];
    for (const kidId of kids) {
      const nested = await this._fetchCommentRecursive(kidId, contextTitle, contextUrl, depth + 1, sinceDate);
      out.push(...nested);
      await this._delay(MAXITEM_WALK_DELAY_MS);
    }

    return out;
  }

  private _stripHtml(html: string): string {
    return html
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(parseInt(d, 10)))
      .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
      .replace(/\s+/g, ' ')
      .trim();
  }

  private async _fetchCommentsForPost(itemId: string): Promise<ResultEx<FetchCommentsResult, CommentFetchError>> {
    try {
      console.log(`[HN Fetcher] Starting to fetch comments for post ${itemId}`);

      // Real API implementation
      const response = await fetch(`${HN_BASE}/item/${itemId}.json`);
      if (!response.ok) {
        console.log(`[HN Fetcher] HTTP error ${response.status} for post ${itemId}`);
        return ResultEx.failure(new CommentFetchError(`Failed to fetch HN item ${itemId}`));
      }

      const item = await response.json() as HNItem;
      if (!item) {
        console.log(`[HN Fetcher] Item ${itemId} not found`);
        return ResultEx.failure(new CommentFetchError(`HN item ${itemId} not found`));
      }

      console.log(`[HN Fetcher] Item ${itemId} has ${item.kids?.length || 0} comments`);

      const comments: FetchedCommentRaw[] = [];

      // Recursively fetch comments
      if (item.kids && item.kids.length > 0) {
        await this._fetchCommentsRecursive(item.kids, comments, item.title || 'HN Post', item.url || `${HN_ITEM_URL}${itemId}`, 0);
      }

      console.log(`[HN Fetcher] Successfully collected ${comments.length} comments for post ${itemId}`);

      return ResultEx.success({
        comments,
        errors: undefined
      });
    } catch (error) {
      console.log(`[HN Fetcher] Error: ${error}`);
      return ResultEx.failure(new CommentFetchError(
        `Failed to fetch comments for HN post ${itemId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      ));
    }
  }

  private async _fetchCommentsRecursive(
    commentIds: number[],
    comments: FetchedCommentRaw[],
    storyTitle: string,
    storyUrl: string,
    depth: number,
    maxDepth: number = 10
  ): Promise<void> {
    if (depth >= maxDepth || commentIds.length === 0) {
      return;
    }

    console.log(`[HN Recursive] Processing ${commentIds.length} comments at depth ${depth}`);

    for (const commentId of commentIds.slice(0, 50)) { // Limit to 50 comments per level
      try {
        console.log(`[HN Recursive] Fetching comment ${commentId}`);
        const response = await fetch(`${HN_BASE}/item/${commentId}.json`);
        if (!response.ok) {
          console.log(`[HN Recursive] Failed to fetch comment ${commentId}, status: ${response.status}`);
          continue;
        }

        const comment = await response.json() as HNItem;
        if (!comment || comment.type !== 'comment' || !comment.text) {
          console.log(`[HN Recursive] Comment ${commentId} invalid or deleted`);
          continue;
        }

        console.log(`[HN Recursive] Adding comment ${commentId} to results`);

        comments.push({
          externalId: comment.id!.toString(),
          content: this._stripHtml(comment.text),
          author: comment.by || null,
          url: `${HN_ITEM_URL}${comment.id}`,
          contextTitle: storyTitle,
          contextUrl: storyUrl,
          createdAt: new Date((comment.time || 0) * 1000),
        });

        // Recursively fetch replies
        if (comment.kids && comment.kids.length > 0) {
          await this._fetchCommentsRecursive(comment.kids, comments, storyTitle, storyUrl, depth + 1, maxDepth);
        }
      } catch (error) {
        // Skip failed comments
        continue;
      }
    }
  }

  private _delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}