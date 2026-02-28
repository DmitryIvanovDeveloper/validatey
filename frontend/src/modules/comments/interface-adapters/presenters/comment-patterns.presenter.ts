import { injectable, inject } from 'inversify';
import { COMMENT_TYPES } from '../../types';
import type { GetCommentPatternsUseCase } from '../../application/use-cases/get-comment-patterns.use-case';
import type { GetPatternCommentsUseCase } from '../../application/use-cases/get-pattern-comments.use-case';
import type { CommentPatternAnalysis } from '../../domain/entities/comment-pattern-analysis.entity';

export interface CommentPatternSidebarItem {
  id: string;
  content: string;
  author: string;
  sourceType: string;
  url?: string;
  contextTitle?: string | null;
  contextUrl?: string | null;
  createdAt: string;
  fetchedAt?: string;
  isProcessed?: boolean;
  processedAt?: string | null;
  importOrigin?: string | null;
  subsourceName?: string | null;
  /** Reddit: upvotes / score. */
  score?: number | null;
  /** Reddit: depth in thread (0 = top-level). */
  depth?: number | null;
}

export interface PatternLike {
  type: string;
  label: string;
  count?: number;
  percentage?: number;
  commentIds?: readonly string[] | string[];
  examples?: ReadonlyArray<{ content: string; author?: string; source?: string; url?: string }>;
}

@injectable()
export class CommentPatternsPresenter {
  constructor(
    @inject(COMMENT_TYPES.GetCommentPatternsUseCase)
    private readonly _getCommentPatternsUseCase: GetCommentPatternsUseCase,
    @inject(COMMENT_TYPES.GetPatternCommentsUseCase)
    private readonly _getPatternCommentsUseCase: GetPatternCommentsUseCase
  ) {}

  /**
   * Load pattern analysis (includes list of comment ids per pattern).
   * Flow: presenter -> use case -> repository -> httpClient.
   */
  async loadAnalysis(projectId: string): Promise<{ analysis: CommentPatternAnalysis | null; error: string | null }> {
    const result = await this._getCommentPatternsUseCase.execute(projectId);
    if (result.isSuccess) {
      return { analysis: result.data, error: null };
    }
    return { analysis: null, error: result.error?.message ?? 'Failed to load pattern analysis' };
  }

  /**
   * Load full comments for a pattern by commentIds; fallback to examples if no ids or API returns empty.
   * Flow: presenter -> use case -> repository -> httpClient.
   */
  async loadPatternComments(
    projectId: string,
    pattern: PatternLike,
    patternIndex?: number
  ): Promise<{ comments: CommentPatternSidebarItem[]; showingOnlyExamples: boolean }> {
    const hasIds = pattern.commentIds && pattern.commentIds.length > 0;
    if (!hasIds) {
      const items = this.examplesToSidebarItems(pattern.examples ?? []);
      return { comments: items, showingOnlyExamples: true };
    }

    const ids = this.normalizeCommentIds(pattern.commentIds ?? []);
    const result = await this._getPatternCommentsUseCase.execute(
      projectId,
      pattern.type,
      patternIndex,
      ids.length > 0 ? ids : undefined
    );

    if (result.isSuccess && result.data.comments && result.data.comments.length > 0) {
      const comments = result.data.comments as CommentPatternSidebarItem[];
      return { comments, showingOnlyExamples: false };
    }

    const items = this.examplesToSidebarItems(pattern.examples ?? []);
    return { comments: items, showingOnlyExamples: true };
  }

  /** Button label: "N comments" using commentIds length, else pattern.count, else examples length. */
  getPatternButtonLabel(pattern: PatternLike): string {
    const hasIds = pattern.commentIds && pattern.commentIds.length > 0;
    const n = hasIds
      ? (pattern.commentIds?.length ?? 0)
      : (typeof pattern.count === 'number' && pattern.count >= 0)
        ? pattern.count
        : (pattern.examples?.length ?? 0);
    return n ? `${n} comments` : '0 comments';
  }

  /** Hint when sidebar shows only examples (no commentIds or API returned empty). */
  getSidebarHint(
    pattern: PatternLike | null,
    showingOnlyExamples: boolean,
    commentsShownCount: number
  ): string | null {
    if (!showingOnlyExamples || !pattern) return null;
    const total = typeof pattern.count === 'number' && pattern.count >= 0 ? pattern.count : commentsShownCount;
    return `Showing ${commentsShownCount} example(s). This pattern has ${total} comments in total; re-run research to link and view all.`;
  }

  /** Check if pattern has content to show (commentIds or examples). */
  hasPatternContent(pattern: PatternLike): boolean {
    const hasIds = pattern.commentIds && pattern.commentIds.length > 0;
    const hasExamples = pattern.examples && pattern.examples.length > 0;
    return !!hasIds || !!hasExamples;
  }

  private readonly uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  private normalizeCommentIds(commentIds: readonly string[] | string[]): string[] {
    const out: string[] = [];
    for (const id of commentIds) {
      const s = typeof id === 'string' ? id : (id && typeof id === 'object' && 'id' in id ? (id as { id: string }).id : String(id));
      const trimmed = s?.trim?.() ?? String(s);
      if (this.uuidRe.test(trimmed)) {
        out.push(trimmed);
      } else {
        const match = trimmed.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
        if (match) out.push(match[0]!);
      }
    }
    return out;
  }

  private examplesToSidebarItems(
    examples: ReadonlyArray<{ content: string; author?: string; source?: string; url?: string }>
  ): CommentPatternSidebarItem[] {
    if (!examples?.length) return [];
    return examples.map((ex, idx) => ({
      id: `example-${idx}`,
      content: ex.content,
      author: ex.author ?? 'Anonymous',
      sourceType: (ex.source?.toLowerCase().replace(/\s+/g, '') ?? '') || 'other',
      url: ex.url,
      contextTitle: null,
      contextUrl: ex.url ?? null,
      createdAt: new Date().toISOString(),
      fetchedAt: new Date().toISOString(),
      isProcessed: false,
      processedAt: null,
      importOrigin: null,
      subsourceName: ex.source ?? null,
    }));
  }
}
