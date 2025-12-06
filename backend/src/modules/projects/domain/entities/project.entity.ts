import { randomUUID } from 'crypto';

export type ProjectStatus = 'draft' | 'active' | 'completed' | 'archived';

export interface Project {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly status: ProjectStatus;
  readonly segment: Segment | null;
  readonly hypothesis: Hypothesis | null;
  readonly targetAudience: string | null;
  readonly cost: number | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// Frontend requirements: { description: string, demographics: object }
export interface Segment {
  readonly description: string;
  readonly demographics: Record<string, any>;
}

// Frontend requirements: { description: string, assumptions: string[] }
export interface Hypothesis {
  readonly description: string;
  readonly assumptions: string[];
}

export class ProjectEntity {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly name: string,
    public readonly status: ProjectStatus,
    public readonly segment: Segment | null,
    public readonly hypothesis: Hypothesis | null,
    public readonly targetAudience: string | null,
    public readonly cost: number | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(
    userId: string,
    name: string,
    segment?: Segment,
    hypothesis?: Hypothesis,
    targetAudience?: string,
    cost?: number
  ): ProjectEntity {
    if (!name || name.trim().length === 0) {
      throw new Error('Project name is required');
    }

    if (name.length > 255) {
      throw new Error('Project name must be less than 255 characters');
    }

    const now = new Date();
    return new ProjectEntity(
      this.generateId(),
      userId,
      name.trim(),
      'draft',
      segment || null,
      hypothesis || null,
      targetAudience || null,
      cost || null,
      now,
      now
    );
  }

  static fromData(data: Project): ProjectEntity {
    return new ProjectEntity(
      data.id,
      data.userId,
      data.name,
      data.status,
      data.segment,
      data.hypothesis,
      data.targetAudience,
      data.cost,
      data.createdAt,
      data.updatedAt
    );
  }

  withStatus(status: ProjectStatus): ProjectEntity {
    return new ProjectEntity(
      this.id,
      this.userId,
      this.name,
      status,
      this.segment,
      this.hypothesis,
      this.targetAudience,
      this.cost,
      this.createdAt,
      new Date()
    );
  }

  withSegment(segment: Segment): ProjectEntity {
    return new ProjectEntity(
      this.id,
      this.userId,
      this.name,
      this.status,
      segment,
      this.hypothesis,
      this.targetAudience,
      this.cost,
      this.createdAt,
      new Date()
    );
  }

  withHypothesis(hypothesis: Hypothesis): ProjectEntity {
    return new ProjectEntity(
      this.id,
      this.userId,
      this.name,
      this.status,
      this.segment,
      hypothesis,
      this.targetAudience,
      this.cost,
      this.createdAt,
      new Date()
    );
  }

  withTargetAudience(targetAudience: string): ProjectEntity {
    return new ProjectEntity(
      this.id,
      this.userId,
      this.name,
      this.status,
      this.segment,
      this.hypothesis,
      targetAudience,
      this.cost,
      this.createdAt,
      new Date()
    );
  }

  withName(name: string): ProjectEntity {
    if (!name || name.trim().length === 0) {
      throw new Error('Project name is required');
    }
    if (name.length > 255) {
      throw new Error('Project name must be less than 255 characters');
    }
    return new ProjectEntity(
      this.id,
      this.userId,
      name.trim(),
      this.status,
      this.segment,
      this.hypothesis,
      this.targetAudience,
      this.cost,
      this.createdAt,
      new Date()
    );
  }

  withCost(cost: number): ProjectEntity {
    if (cost < 0) {
      throw new Error('Cost cannot be negative');
    }
    return new ProjectEntity(
      this.id,
      this.userId,
      this.name,
      this.status,
      this.segment,
      this.hypothesis,
      this.targetAudience,
      cost,
      this.createdAt,
      new Date()
    );
  }

  toData(): Project {
    return {
      id: this.id,
      userId: this.userId,
      name: this.name,
      status: this.status,
      segment: this.segment,
      hypothesis: this.hypothesis,
      targetAudience: this.targetAudience,
      cost: this.cost,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  private static generateId(): string {
    // Generate UUID v4 using Node.js crypto.randomUUID()
    return randomUUID();
  }
}

