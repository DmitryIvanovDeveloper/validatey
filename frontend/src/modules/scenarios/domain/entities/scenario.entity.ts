export type ScenarioStatus = 'draft' | 'generated' | 'approved' | 'rejected';

export class Scenario {
  constructor(
    public readonly id: string,
    public readonly projectId: string,
    public readonly content: string,
    public readonly version: number,
    public readonly status: ScenarioStatus,
    public readonly createdAt: Date
  ) {
    if (!id || id.trim().length === 0) {
      throw new Error('Scenario id cannot be empty');
    }
    if (!projectId || projectId.trim().length === 0) {
      throw new Error('Scenario projectId cannot be empty');
    }
    if (!content || content.trim().length === 0) {
      throw new Error('Scenario content cannot be empty');
    }
  }

  withContent(content: string): Scenario {
    return new Scenario(
      this.id,
      this.projectId,
      content,
      this.version,
      this.status,
      this.createdAt
    );
  }

  withVersion(version: number): Scenario {
    return new Scenario(
      this.id,
      this.projectId,
      this.content,
      version,
      this.status,
      this.createdAt
    );
  }
}



