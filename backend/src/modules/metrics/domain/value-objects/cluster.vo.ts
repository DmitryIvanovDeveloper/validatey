export interface Cluster {
  readonly id: string;
  readonly projectId: string;
  readonly quoteIds: string[];
  readonly theme: string;
  readonly representativeQuote: string;
  readonly size: number;
  readonly createdAt: Date;
}

export class ClusterVO {
  private constructor(
    private readonly _id: string,
    private readonly _projectId: string,
    private readonly _quoteIds: string[],
    private readonly _theme: string,
    private readonly _representativeQuote: string,
    private readonly _size: number,
    private readonly _createdAt: Date
  ) {
    if (_quoteIds.length === 0) {
      throw new Error('Cluster must contain at least one quote');
    }
    if (!_theme || _theme.trim().length === 0) {
      throw new Error('Cluster theme is required');
    }
  }

  static create(
    id: string,
    projectId: string,
    quoteIds: string[],
    theme: string,
    representativeQuote: string,
    createdAt?: Date
  ): ClusterVO {
    return new ClusterVO(
      id,
      projectId,
      quoteIds,
      theme,
      representativeQuote,
      quoteIds.length,
      createdAt || new Date()
    );
  }

  get id(): string {
    return this._id;
  }

  get projectId(): string {
    return this._projectId;
  }

  get quoteIds(): string[] {
    return [...this._quoteIds];
  }

  get theme(): string {
    return this._theme;
  }

  get representativeQuote(): string {
    return this._representativeQuote;
  }

  get size(): number {
    return this._size;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  toData(): Cluster {
    return {
      id: this._id,
      projectId: this._projectId,
      quoteIds: [...this._quoteIds],
      theme: this._theme,
      representativeQuote: this._representativeQuote,
      size: this._size,
      createdAt: this._createdAt,
    };
  }
}



