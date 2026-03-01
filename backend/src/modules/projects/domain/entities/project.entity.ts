import { randomUUID } from 'crypto';
import { createHash } from 'crypto';

export type ProjectStatus = 'draft' | 'active' | 'completed' | 'archived';

export interface MarketContext {
  readonly marketPicture?: string;
  readonly marketFit?: string;
  readonly differentiation?: string;
}

export interface Project {
  readonly id: string;
  readonly userId: string;
  readonly workspaceId: string | null;
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
  /** Public survey link: one link for many respondents. */
  readonly publicAccessEnabled: boolean;
  readonly publicSlug: string | null;
  readonly maxPublicResponses: number | null;
  readonly requirePublicEmail: boolean;
  readonly captchaEnabled: boolean;
  /** Optional target date for validation decision (Overview Time Health). */
  readonly deadline: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// Frontend requirements: { description: string, demographics: object }
export interface Segment {
  readonly description: string;
  readonly demographics: Record<string, any>;
}

/** Single key assumption with stable id for research assessment mapping. */
export interface AssumptionItem {
  readonly id: string;
  readonly text: string;
}

// Frontend requirements: { description: string, assumptions: AssumptionItem[] } (legacy: string[] accepted at API)
export interface Hypothesis {
  readonly description: string;
  readonly assumptions: AssumptionItem[];
}

/** Generate stable UUID based on text content. */
function generateStableUUID(text: string): string {
  const hash = createHash('sha256').update(text.trim()).digest('hex');
  // Convert first 16 bytes of hash to UUID format
  const bytes = Buffer.from(hash.slice(0, 32), 'hex');
  // Set version (4) and variant bits
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10
  return [
    bytes.slice(0, 4).toString('hex'),
    bytes.slice(4, 6).toString('hex'),
    bytes.slice(6, 8).toString('hex'),
    bytes.slice(8, 10).toString('hex'),
    bytes.slice(10, 16).toString('hex')
  ].join('-');
}

/** Normalize assumptions from API/DB (string[] or {id?, text}[]) to AssumptionItem[]. */
export function normalizeAssumptions(
  raw: readonly string[] | ReadonlyArray<{ id?: string; text: string }> | null | undefined
): AssumptionItem[] {
  if (!raw || !Array.isArray(raw) || raw.length === 0) return [];
  const result: AssumptionItem[] = [];
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (typeof item === 'string') {
      result.push({ id: generateStableUUID(item), text: item.trim() });
    } else if (item && typeof item === 'object' && typeof (item as { text?: string }).text === 'string') {
      const o = item as { id?: string; text: string };
      result.push({
        id: o.id && o.id.trim() ? o.id.trim() : generateStableUUID(o.text),
        text: o.text.trim(),
      });
    }
  }
  return result;
}

export class ProjectEntity {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly workspaceId: string | null,
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
    public readonly publicAccessEnabled: boolean,
    public readonly publicSlug: string | null,
    public readonly maxPublicResponses: number | null,
    public readonly requirePublicEmail: boolean,
    public readonly captchaEnabled: boolean,
    public readonly deadline: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(
    userId: string,
    name: string,
    workspaceId?: string | null,
    segment?: Segment,
    hypothesis?: Hypothesis,
    marketContext?: MarketContext | null,
    targetAudience?: string,
    cost?: number,
    scenarioTemplateSlug?: string
  ): ProjectEntity {
    if (!name || name.trim().length === 0) {
      throw new Error('Project name is required');
    }

    if (name.length > 255) {
      throw new Error('Project name must be less than 255 characters');
    }

    // Normalize hypothesis if it comes in legacy format with risks array
    let normalizedHypothesis = hypothesis;
    if (hypothesis && (!hypothesis.description || !hypothesis.assumptions)) {
      // Check if it's the legacy format with risks array
      const legacyHypothesis = hypothesis as any;
      if (legacyHypothesis.problem || legacyHypothesis.solution || legacyHypothesis.risks) {
        normalizedHypothesis = {
          description: legacyHypothesis.problem && legacyHypothesis.solution
            ? `${legacyHypothesis.problem}\n\n${legacyHypothesis.solution}`
            : legacyHypothesis.problem || legacyHypothesis.solution || '',
          assumptions: normalizeAssumptions(legacyHypothesis.risks || [])
        };
      }
    }

    const now = new Date();
    return new ProjectEntity(
      this.generateId(),
      userId,
      workspaceId ?? null,
      name.trim(),
      'draft',
      segment || null,
      normalizedHypothesis || null,
      marketContext ?? null,
      targetAudience || null,
      cost || null,
      null,
      null,
      null,
      null,
      scenarioTemplateSlug || null,
      false,
      null,
      null,
      false,
      false,
      null,
      now,
      now
    );
  }

  static fromData(data: Project): ProjectEntity {
    return new ProjectEntity(
      data.id,
      data.userId,
      data.workspaceId ?? null,
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
      data.publicAccessEnabled ?? false,
      data.publicSlug ?? null,
      data.maxPublicResponses ?? null,
      data.requirePublicEmail ?? false,
      data.captchaEnabled ?? false,
      data.deadline ?? null,
      data.createdAt,
      data.updatedAt
    );
  }

  withStatus(status: ProjectStatus): ProjectEntity {
    return new ProjectEntity(
      this.id,
      this.userId,
      this.workspaceId,
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
      this.publicAccessEnabled,
      this.publicSlug,
      this.maxPublicResponses,
      this.requirePublicEmail,
      this.captchaEnabled,
      this.deadline,
      this.createdAt,
      new Date()
    );
  }

  withSegment(segment: Segment): ProjectEntity {
    return new ProjectEntity(
      this.id,
      this.userId,
      this.workspaceId,
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
      this.publicAccessEnabled,
      this.publicSlug,
      this.maxPublicResponses,
      this.requirePublicEmail,
      this.captchaEnabled,
      this.deadline,
      this.createdAt,
      new Date()
    );
  }

  withHypothesis(hypothesis: Hypothesis): ProjectEntity {
    return new ProjectEntity(
      this.id,
      this.userId,
      this.workspaceId,
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
      this.publicAccessEnabled,
      this.publicSlug,
      this.maxPublicResponses,
      this.requirePublicEmail,
      this.captchaEnabled,
      this.deadline,
      this.createdAt,
      new Date()
    );
  }

  withMarketContext(marketContext: MarketContext | null): ProjectEntity {
    return new ProjectEntity(
      this.id,
      this.userId,
      this.workspaceId,
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
      this.publicAccessEnabled,
      this.publicSlug,
      this.maxPublicResponses,
      this.requirePublicEmail,
      this.captchaEnabled,
      this.deadline,
      this.createdAt,
      new Date()
    );
  }

  withTargetAudience(targetAudience: string): ProjectEntity {
    return new ProjectEntity(
      this.id,
      this.userId,
      this.workspaceId,
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
      this.publicAccessEnabled,
      this.publicSlug,
      this.maxPublicResponses,
      this.requirePublicEmail,
      this.captchaEnabled,
      this.deadline,
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
      this.workspaceId,
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
      this.publicAccessEnabled,
      this.publicSlug,
      this.maxPublicResponses,
      this.requirePublicEmail,
      this.captchaEnabled,
      this.deadline,
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
      this.workspaceId,
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
      this.publicAccessEnabled,
      this.publicSlug,
      this.maxPublicResponses,
      this.requirePublicEmail,
      this.captchaEnabled,
      this.deadline,
      this.createdAt,
      new Date()
    );
  }

  withConsentText(consentText: string | null): ProjectEntity {
    return new ProjectEntity(
      this.id,
      this.userId,
      this.workspaceId,
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
      this.publicAccessEnabled,
      this.publicSlug,
      this.maxPublicResponses,
      this.requirePublicEmail,
      this.captchaEnabled,
      this.deadline,
      this.createdAt,
      new Date()
    );
  }

  withDataUsageText(dataUsageText: string | null): ProjectEntity {
    return new ProjectEntity(
      this.id,
      this.userId,
      this.workspaceId,
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
      this.publicAccessEnabled,
      this.publicSlug,
      this.maxPublicResponses,
      this.requirePublicEmail,
      this.captchaEnabled,
      this.deadline,
      this.createdAt,
      new Date()
    );
  }

  withPrivacyPolicyUrl(privacyPolicyUrl: string | null): ProjectEntity {
    return new ProjectEntity(
      this.id,
      this.userId,
      this.workspaceId,
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
      this.publicAccessEnabled,
      this.publicSlug,
      this.maxPublicResponses,
      this.requirePublicEmail,
      this.captchaEnabled,
      this.deadline,
      this.createdAt,
      new Date()
    );
  }

  withTermsOfServiceUrl(termsOfServiceUrl: string | null): ProjectEntity {
    return new ProjectEntity(
      this.id,
      this.userId,
      this.workspaceId,
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
      this.publicAccessEnabled,
      this.publicSlug,
      this.maxPublicResponses,
      this.requirePublicEmail,
      this.captchaEnabled,
      this.deadline,
      this.createdAt,
      new Date()
    );
  }

  withScenarioTemplateSlug(scenarioTemplateSlug: string | null): ProjectEntity {
    return new ProjectEntity(
      this.id,
      this.userId,
      this.workspaceId,
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
      this.publicAccessEnabled,
      this.publicSlug,
      this.maxPublicResponses,
      this.requirePublicEmail,
      this.captchaEnabled,
      this.deadline,
      this.createdAt,
      new Date()
    );
  }

  withDeadline(deadline: Date | null): ProjectEntity {
    return new ProjectEntity(
      this.id,
      this.userId,
      this.workspaceId,
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
      this.scenarioTemplateSlug,
      this.publicAccessEnabled,
      this.publicSlug,
      this.maxPublicResponses,
      this.requirePublicEmail,
      this.captchaEnabled,
      deadline,
      this.createdAt,
      new Date()
    );
  }

  withPublicSettings(settings: {
    publicAccessEnabled: boolean;
    publicSlug: string | null;
    maxPublicResponses: number | null;
    requirePublicEmail: boolean;
    captchaEnabled: boolean;
  }): ProjectEntity {
    return new ProjectEntity(
      this.id,
      this.userId,
      this.workspaceId,
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
      this.scenarioTemplateSlug,
      settings.publicAccessEnabled,
      settings.publicSlug,
      settings.maxPublicResponses,
      settings.requirePublicEmail,
      settings.captchaEnabled,
      this.deadline,
      this.createdAt,
      new Date()
    );
  }

  toData(): Project {
    return {
      id: this.id,
      userId: this.userId,
      workspaceId: this.workspaceId,
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
      publicAccessEnabled: this.publicAccessEnabled,
      publicSlug: this.publicSlug,
      maxPublicResponses: this.maxPublicResponses,
      requirePublicEmail: this.requirePublicEmail,
      captchaEnabled: this.captchaEnabled,
      deadline: this.deadline,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  private static generateId(): string {
    // Generate UUID v4 using Node.js crypto.randomUUID()
    return randomUUID();
  }
}

