import { ProjectStatus, Segment, Hypothesis, MarketContext } from '../../../domain/entities/project.entity';

/** Input for hypothesis: assumptions can be legacy string[] or { id?, text }[]. */
export type HypothesisInput = {
  description: string;
  assumptions?: readonly string[] | ReadonlyArray<{ id?: string; text: string }>;
};

export type UpdateProjectUseCaseRequest = {
  projectId: string;
  userId: string;
  name?: string;
  status?: ProjectStatus;
  segment?: Segment;
  /** Accepts Hypothesis (AssumptionItem[]) or HypothesisInput (string[] / {id?, text}[]). */
  hypothesis?: Hypothesis | HypothesisInput;
  marketContext?: MarketContext;
  targetAudience?: string;
  cost?: number;
  /** Consent text shown before survey (GDPR). */
  consentText?: string | null;
  /** How we use data (GDPR). */
  dataUsageText?: string | null;
  /** Privacy Policy URL shown on consent screen. */
  privacyPolicyUrl?: string | null;
  /** Terms of Service URL shown on consent screen. */
  termsOfServiceUrl?: string | null;
  /** Scenario template slug (wtp | feature-demand | value-prop). */
  scenarioTemplateSlug?: string | null;
  /** Public survey link settings. */
  publicAccessEnabled?: boolean;
  publicSlug?: string | null;
  maxPublicResponses?: number | null;
  requirePublicEmail?: boolean;
  captchaEnabled?: boolean;
  /** Optional target date for validation decision. */
  deadline?: string | Date | null;
};

export type UpdateProjectUseCaseResponse = {
  project: {
    id: string;
    userId: string;
    name: string;
    status: ProjectStatus;
    segment: Segment | null;
    hypothesis: Hypothesis | null;
    marketContext: MarketContext | null;
    targetAudience: string | null;
    cost: number | null;
    consentText: string | null;
    dataUsageText: string | null;
    privacyPolicyUrl: string | null;
    termsOfServiceUrl: string | null;
    scenarioTemplateSlug: string | null;
    publicAccessEnabled: boolean;
    publicSlug: string | null;
    maxPublicResponses: number | null;
    requirePublicEmail: boolean;
    captchaEnabled: boolean;
    deadline: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };
};



