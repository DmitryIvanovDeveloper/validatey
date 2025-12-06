export interface Scenario {
  readonly id: string;
  readonly projectId: string;
  readonly version: number;
  readonly content: string;
  readonly isGenerated: boolean;
  readonly isEdited: boolean;
  readonly metadata: ScenarioMetadata | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface ScenarioMetadata {
  readonly tone: string;
  readonly length: number;
  readonly branches: ScenarioBranch[];
}

export interface ScenarioBranch {
  readonly questionId: string;
  readonly condition: string;
  readonly nextQuestionId: string;
}

export class ScenarioEntity {
  private constructor(
    public readonly id: string,
    public readonly projectId: string,
    public readonly version: number,
    public readonly content: string,
    public readonly isGenerated: boolean,
    public readonly isEdited: boolean,
    public readonly metadata: ScenarioMetadata | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(
    projectId: string,
    content: string,
    isGenerated: boolean = false,
    metadata?: ScenarioMetadata
  ): ScenarioEntity {
    if (!content || content.trim().length === 0) {
      throw new Error('Scenario content is required');
    }

    const now = new Date();
    return new ScenarioEntity(
      this.generateId(),
      projectId,
      1,
      content.trim(),
      isGenerated,
      false,
      metadata || null,
      now,
      now
    );
  }

  static fromData(data: Scenario): ScenarioEntity {
    return new ScenarioEntity(
      data.id,
      data.projectId,
      data.version,
      data.content,
      data.isGenerated,
      data.isEdited,
      data.metadata,
      data.createdAt,
      data.updatedAt
    );
  }

  withVersion(version: number): ScenarioEntity {
    if (version < 1) {
      throw new Error('Version must be greater than 0');
    }
    return new ScenarioEntity(
      this.id,
      this.projectId,
      version,
      this.content,
      this.isGenerated,
      this.isEdited,
      this.metadata,
      this.createdAt,
      new Date()
    );
  }

  withContent(content: string, isEdited: boolean = true): ScenarioEntity {
    if (!content || content.trim().length === 0) {
      throw new Error('Scenario content is required');
    }
    return new ScenarioEntity(
      this.id,
      this.projectId,
      this.version,
      content.trim(),
      this.isGenerated,
      isEdited,
      this.metadata,
      this.createdAt,
      new Date()
    );
  }

  withMetadata(metadata: ScenarioMetadata): ScenarioEntity {
    return new ScenarioEntity(
      this.id,
      this.projectId,
      this.version,
      this.content,
      this.isGenerated,
      this.isEdited,
      metadata,
      this.createdAt,
      new Date()
    );
  }

  withEdited(isEdited: boolean): ScenarioEntity {
    return new ScenarioEntity(
      this.id,
      this.projectId,
      this.version,
      this.content,
      this.isGenerated,
      isEdited,
      this.metadata,
      this.createdAt,
      new Date()
    );
  }

  toData(): Scenario {
    return {
      id: this.id,
      projectId: this.projectId,
      version: this.version,
      content: this.content,
      isGenerated: this.isGenerated,
      isEdited: this.isEdited,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  private static generateId(): string {
    return `scen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

