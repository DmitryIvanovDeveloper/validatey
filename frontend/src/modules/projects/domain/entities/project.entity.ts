import { Segment } from '../value-objects/segment.vo';
import { Hypothesis } from '../value-objects/hypothesis.vo';

export type ProjectStatus = 'draft' | 'in-progress' | 'completed' | 'archived';

export class Project {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly segment: Segment | null,
    public readonly hypothesis: Hypothesis | null,
    public readonly status: ProjectStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {
    if (!id || id.trim().length === 0) {
      throw new Error('Project id cannot be empty');
    }
    if (!name || name.trim().length === 0) {
      throw new Error('Project name cannot be empty');
    }
  }

  withSegment(segment: Segment): Project {
    return new Project(
      this.id,
      this.name,
      segment,
      this.hypothesis,
      this.status,
      this.createdAt,
      new Date()
    );
  }

  withHypothesis(hypothesis: Hypothesis): Project {
    return new Project(
      this.id,
      this.name,
      this.segment,
      hypothesis,
      this.status,
      this.createdAt,
      new Date()
    );
  }

  withStatus(status: ProjectStatus): Project {
    return new Project(
      this.id,
      this.name,
      this.segment,
      this.hypothesis,
      status,
      this.createdAt,
      new Date()
    );
  }
}


