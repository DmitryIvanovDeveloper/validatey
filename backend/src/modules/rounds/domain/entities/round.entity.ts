export type RoundStatus = 'draft' | 'active' | 'completed' | 'archived';
export type RoundType = 'survey' | 'interview' | 'ab_test' | 'field';

export interface RoundResults {
  readonly keyFinding?: string;
  readonly confidence?: number;
  readonly nextQuestions?: string[];
}

export interface Round {
  readonly id: string;
  readonly projectId: string;
  readonly parentRoundId: string | null;
  readonly title: string;
  readonly status: RoundStatus;
  readonly type: RoundType;
  readonly sortOrder: number;
  readonly results: RoundResults | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export class RoundEntity {
  private constructor(
    public readonly id: string,
    public readonly projectId: string,
    public readonly parentRoundId: string | null,
    public readonly title: string,
    public readonly status: RoundStatus,
    public readonly type: RoundType,
    public readonly sortOrder: number,
    public readonly results: RoundResults | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(params: {
    id: string;
    projectId: string;
    parentRoundId?: string | null;
    title: string;
    status?: RoundStatus;
    type: RoundType;
    sortOrder?: number;
    results?: RoundResults | null;
  }): RoundEntity {
    const now = new Date();
    return new RoundEntity(
      params.id,
      params.projectId,
      params.parentRoundId ?? null,
      params.title?.trim() || 'Round',
      params.status ?? 'draft',
      params.type,
      params.sortOrder ?? 0,
      params.results ?? null,
      now,
      now
    );
  }

  static fromData(data: Round): RoundEntity {
    return new RoundEntity(
      data.id,
      data.projectId,
      data.parentRoundId,
      data.title,
      data.status,
      data.type,
      data.sortOrder,
      data.results,
      data.createdAt,
      data.updatedAt
    );
  }

  withTitle(title: string): RoundEntity {
    return new RoundEntity(
      this.id,
      this.projectId,
      this.parentRoundId,
      title?.trim() || this.title,
      this.status,
      this.type,
      this.sortOrder,
      this.results,
      this.createdAt,
      new Date()
    );
  }

  withStatus(status: RoundStatus): RoundEntity {
    return new RoundEntity(
      this.id,
      this.projectId,
      this.parentRoundId,
      this.title,
      status,
      this.type,
      this.sortOrder,
      this.results,
      this.createdAt,
      new Date()
    );
  }

  withType(type: RoundType): RoundEntity {
    return new RoundEntity(
      this.id,
      this.projectId,
      this.parentRoundId,
      this.title,
      this.status,
      type,
      this.sortOrder,
      this.results,
      this.createdAt,
      new Date()
    );
  }

  withResults(results: RoundResults | null): RoundEntity {
    return new RoundEntity(
      this.id,
      this.projectId,
      this.parentRoundId,
      this.title,
      this.status,
      this.type,
      this.sortOrder,
      results,
      this.createdAt,
      new Date()
    );
  }

  withSortOrder(sortOrder: number): RoundEntity {
    return new RoundEntity(
      this.id,
      this.projectId,
      this.parentRoundId,
      this.title,
      this.status,
      this.type,
      sortOrder,
      this.results,
      this.createdAt,
      new Date()
    );
  }

  toData(): Round {
    return {
      id: this.id,
      projectId: this.projectId,
      parentRoundId: this.parentRoundId,
      title: this.title,
      status: this.status,
      type: this.type,
      sortOrder: this.sortOrder,
      results: this.results,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
