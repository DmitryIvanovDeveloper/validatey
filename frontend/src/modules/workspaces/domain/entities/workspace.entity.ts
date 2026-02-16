export interface Workspace {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly iconUrl?: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export class WorkspaceEntity {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly name: string,
    public readonly iconUrl: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(
    userId: string,
    name: string
  ): WorkspaceEntity {
    if (!name || name.trim().length === 0) {
      throw new Error('Workspace name is required');
    }

    if (name.length > 255) {
      throw new Error('Workspace name must be less than 255 characters');
    }

    const now = new Date();
    return new WorkspaceEntity(
      this.generateId(),
      userId,
      name.trim(),
      null,
      now,
      now
    );
  }

  static fromData(data: Workspace): WorkspaceEntity {
    return new WorkspaceEntity(
      data.id,
      data.userId,
      data.name,
      data.iconUrl ?? null,
      data.createdAt,
      data.updatedAt
    );
  }

  withName(name: string): WorkspaceEntity {
    if (!name || name.trim().length === 0) {
      throw new Error('Workspace name is required');
    }
    if (name.length > 255) {
      throw new Error('Workspace name must be less than 255 characters');
    }
    return new WorkspaceEntity(
      this.id,
      this.userId,
      name.trim(),
      this.iconUrl,
      this.createdAt,
      new Date()
    );
  }

  withIconUrl(iconUrl: string | null): WorkspaceEntity {
    return new WorkspaceEntity(
      this.id,
      this.userId,
      this.name,
      iconUrl,
      this.createdAt,
      new Date()
    );
  }

  toData(): Workspace {
    return {
      id: this.id,
      userId: this.userId,
      name: this.name,
      iconUrl: this.iconUrl,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  private static generateId(): string {
    // Simple ID generation for frontend - in real app this would come from backend
    return `workspace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}