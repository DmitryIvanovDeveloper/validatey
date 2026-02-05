import { randomUUID } from 'crypto';

export type ProjectStatus = 'draft' | 'active' | 'completed' | 'archived';

export interface MarketContext {
  readonly marketPicture?: string;
  readonly marketFit?: string;
  readonly differentiation?: string;
}

export interface Project {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly status: ProjectStatus;
  readonly segment: Segment | null;
  readonly hypothesis: Hypothesis | null;
  readonly marketContext: MarketContext | null;
  readonly targetAudience: string | null;
  readonly cost: number | null;
  /** Consent text shown before survey (GDPR). */
  readonly consentText: string | null;
  /** How we use data (GDPR). */
  readonly dataUsageText: string | null;
  /** Privacy Policy URL shown on consent screen. */
  readonly privacyPolicyUrl: string | null;
  /** Terms of Service URL shown on consent screen. */
  readonly termsOfServiceUrl: string | null;
  /** Selected scenario template: wtp | feature-demand | value-prop. */
  readonly scenarioTemplateSlug: string | null;
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
    public readonly marketContext: MarketContext | null,
    public readonly targetAudience: string | null,
    public readonly cost: number | null,
    public readonly consentText: string | null,
    public readonly dataUsageText: string | null,
    public readonly privacyPolicyUrl: string | null,
    public readonly termsOfServiceUrl: string | null,
    public readonly scenarioTemplateSlug: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(
    userId: string,
    name: string,
    segment?: Segment,
    hypothesis?: Hypothesis,
    marketContext?: MarketContext | null,
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
      marketContext ?? null,
      targetAudience || null,
      cost || null,
      null,
      null,
      null,
      null,
      null,
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
      data.marketContext ?? null,
      data.targetAudience,
      data.cost,
      data.consentText ?? null,
      data.dataUsageText ?? null,
      data.privacyPolicyUrl ?? null,
      data.termsOfServiceUrl ?? null,
      data.scenarioTemplateSlug ?? null,
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
      this.marketContext,
      this.targetAudience,
      this.cost,
      this.consentText,
      this.dataUsageText,
      this.privacyPolicyUrl,
      this.termsOfServiceUrl,
      this.scenarioTemplateSlug,
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
      this.marketContext,
      this.targetAudience,
      this.cost,
      this.consentText,
      this.dataUsageText,
      this.privacyPolicyUrl,
      this.termsOfServiceUrl,
      this.scenarioTemplateSlug,
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
      this.marketContext,
      this.targetAudience,
      this.cost,
      this.consentText,
      this.dataUsageText,
      this.privacyPolicyUrl,
      this.termsOfServiceUrl,
      this.scenarioTemplateSlug,
      this.createdAt,
      new Date()
    );
  }

  withMarketContext(marketContext: MarketContext | null): ProjectEntity {
    return new ProjectEntity(
      this.id,
      this.userId,
      this.name,
      this.status,
      this.segment,
      this.hypothesis,
      marketContext,
      this.targetAudience,
      this.cost,
      this.consentText,
      this.dataUsageText,
      this.privacyPolicyUrl,
      this.termsOfServiceUrl,
      this.scenarioTemplateSlug,
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
      this.marketContext,
      targetAudience,
      this.cost,
      this.consentText,
      this.dataUsageText,
      this.privacyPolicyUrl,
      this.termsOfServiceUrl,
      this.scenarioTemplateSlug,
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
      this.marketContext,
      this.targetAudience,
      this.cost,
      this.consentText,
      this.dataUsageText,
      this.privacyPolicyUrl,
      this.termsOfServiceUrl,
      this.scenarioTemplateSlug,
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
      this.marketContext,
      this.targetAudience,
      cost,
      this.consentText,
      this.dataUsageText,
      this.privacyPolicyUrl,
      this.termsOfServiceUrl,
      this.scenarioTemplateSlug,
      this.createdAt,
      new Date()
    );
  }

  withConsentText(consentText: string | null): ProjectEntity {
    return new ProjectEntity(
      this.id,
      this.userId,
      this.name,
      this.status,
      this.segment,
      this.hypothesis,
      this.marketContext,
      this.targetAudience,
      this.cost,
      consentText,
      this.dataUsageText,
      this.privacyPolicyUrl,
      this.termsOfServiceUrl,
      this.scenarioTemplateSlug,
      this.createdAt,
      new Date()
    );
  }

  withDataUsageText(dataUsageText: string | null): ProjectEntity {
    return new ProjectEntity(
      this.id,
      this.userId,
      this.name,
      this.status,
      this.segment,
      this.hypothesis,
      this.marketContext,
      this.targetAudience,
      this.cost,
      this.consentText,
      dataUsageText,
      this.privacyPolicyUrl,
      this.termsOfServiceUrl,
      this.scenarioTemplateSlug,
      this.createdAt,
      new Date()
    );
  }

  withPrivacyPolicyUrl(privacyPolicyUrl: string | null): ProjectEntity {
    return new ProjectEntity(
      this.id,
      this.userId,
      this.name,
      this.status,
      this.segment,
      this.hypothesis,
      this.marketContext,
      this.targetAudience,
      this.cost,
      this.consentText,
      this.dataUsageText,
      privacyPolicyUrl,
      this.termsOfServiceUrl,
      this.scenarioTemplateSlug,
      this.createdAt,
      new Date()
    );
  }

  withTermsOfServiceUrl(termsOfServiceUrl: string | null): ProjectEntity {
    return new ProjectEntity(
      this.id,
      this.userId,
      this.name,
      this.status,
      this.segment,
      this.hypothesis,
      this.marketContext,
      this.targetAudience,
      this.cost,
      this.consentText,
      this.dataUsageText,
      this.privacyPolicyUrl,
      termsOfServiceUrl,
      this.scenarioTemplateSlug,
      this.createdAt,
      new Date()
    );
  }

  withScenarioTemplateSlug(scenarioTemplateSlug: string | null): ProjectEntity {
    return new ProjectEntity(
      this.id,
      this.userId,
      this.name,
      this.status,
      this.segment,
      this.hypothesis,
      this.marketContext,
      this.targetAudience,
      this.cost,
      this.consentText,
      this.dataUsageText,
      this.privacyPolicyUrl,
      this.termsOfServiceUrl,
      scenarioTemplateSlug,
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
      marketContext: this.marketContext,
      targetAudience: this.targetAudience,
      cost: this.cost,
      consentText: this.consentText,
      dataUsageText: this.dataUsageText,
      privacyPolicyUrl: this.privacyPolicyUrl,
      termsOfServiceUrl: this.termsOfServiceUrl,
      scenarioTemplateSlug: this.scenarioTemplateSlug,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  private static generateId(): string {
    // Generate UUID v4 using Node.js crypto.randomUUID()
    return randomUUID();
  }
}

