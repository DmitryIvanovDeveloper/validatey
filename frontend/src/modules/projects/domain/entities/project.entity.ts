import { Segment } from '../value-objects/segment.vo';
import { Hypothesis } from '../value-objects/hypothesis.vo';

export type ProjectStatus = 'draft' | 'in-progress' | 'completed' | 'archived';

export interface MarketContext {
  marketPicture?: string;
  marketFit?: string;
  differentiation?: string;
}

export class Project {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly segment: Segment | null,
    public readonly hypothesis: Hypothesis | null,
    public readonly marketContext: MarketContext | null,
    public readonly status: ProjectStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly consentText: string | null = null,
    public readonly dataUsageText: string | null = null,
    public readonly privacyPolicyUrl: string | null = null,
    public readonly termsOfServiceUrl: string | null = null
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
      this.marketContext,
      this.status,
      this.createdAt,
      new Date(),
      this.consentText,
      this.dataUsageText,
      this.privacyPolicyUrl,
      this.termsOfServiceUrl
    );
  }

  withHypothesis(hypothesis: Hypothesis): Project {
    return new Project(
      this.id,
      this.name,
      this.segment,
      hypothesis,
      this.marketContext,
      this.status,
      this.createdAt,
      new Date(),
      this.consentText,
      this.dataUsageText,
      this.privacyPolicyUrl,
      this.termsOfServiceUrl
    );
  }

  withStatus(status: ProjectStatus): Project {
    return new Project(
      this.id,
      this.name,
      this.segment,
      this.hypothesis,
      this.marketContext,
      status,
      this.createdAt,
      new Date(),
      this.consentText,
      this.dataUsageText,
      this.privacyPolicyUrl,
      this.termsOfServiceUrl
    );
  }
}



