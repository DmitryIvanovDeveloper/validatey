import { randomUUID } from 'crypto';

/**
 * How the comment was added: api_fetch = from Reddit/HN API, manual = inserted into DB by hand
 */
export type CommentImportOrigin = 'api_fetch' | 'manual';

/**
 * Domain Entity: Comment
 * Comment collected from a source (Reddit, HN, etc.)
 */
export class CommentEntity {
  private constructor(
    public readonly id: string,
    public readonly sourceId: string,
    public readonly projectId: string,
    public readonly externalId: string,
    public readonly content: string,
    public readonly author: string | null,
    public readonly url: string,
    public readonly contextTitle: string | null,
    public readonly contextUrl: string | null,
    public readonly createdAt: Date,
    public readonly fetchedAt: Date,
    public readonly isProcessed: boolean,
    public readonly processedAt: Date | null,
    public readonly importOrigin: CommentImportOrigin | null,
    /** Reddit subreddit name or HN feed type; null for legacy/manual */
    public readonly subsourceName: string | null
  ) {}

  static create(params: {
    sourceId: string;
    projectId: string;
    externalId: string;
    content: string;
    author?: string | null;
    url: string;
    contextTitle?: string | null;
    contextUrl?: string | null;
    createdAt: Date;
    fetchedAt?: Date;
    isProcessed?: boolean;
    processedAt?: Date | null;
    importOrigin?: CommentImportOrigin | null;
    subsourceName?: string | null;
  }): CommentEntity {
    if (!params.content || params.content.trim().length === 0) {
      throw new Error('Comment content is required');
    }

    if (!params.externalId || params.externalId.trim().length === 0) {
      throw new Error('External ID is required');
    }

    if (!params.url || params.url.trim().length === 0) {
      throw new Error('Comment URL is required');
    }

    return new CommentEntity(
      this.generateId(),
      params.sourceId,
      params.projectId,
      params.externalId.trim(),
      params.content.trim(),
      params.author ?? null,
      params.url.trim(),
      params.contextTitle ?? null,
      params.contextUrl ?? null,
      params.createdAt,
      params.fetchedAt ?? new Date(),
      params.isProcessed ?? false,
      params.processedAt ?? null,
      params.importOrigin ?? 'api_fetch',
      params.subsourceName ?? null
    );
  }

  withProcessed(processedAt: Date): CommentEntity {
    return new CommentEntity(
      this.id,
      this.sourceId,
      this.projectId,
      this.externalId,
      this.content,
      this.author,
      this.url,
      this.contextTitle,
      this.contextUrl,
      this.createdAt,
      this.fetchedAt,
      true,
      processedAt,
      this.importOrigin,
      this.subsourceName
    );
  }

  toData() {
    return {
      id: this.id,
      sourceId: this.sourceId,
      projectId: this.projectId,
      externalId: this.externalId,
      content: this.content,
      author: this.author,
      url: this.url,
      contextTitle: this.contextTitle,
      contextUrl: this.contextUrl,
      createdAt: this.createdAt,
      fetchedAt: this.fetchedAt,
      isProcessed: this.isProcessed,
      processedAt: this.processedAt,
      importOrigin: this.importOrigin,
      subsourceName: this.subsourceName,
    };
  }

  private static generateId(): string {
    return randomUUID();
  }
}