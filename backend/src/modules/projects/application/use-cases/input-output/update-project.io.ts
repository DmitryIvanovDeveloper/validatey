import { ProjectStatus, Segment, Hypothesis, MarketContext } from '../../../domain/entities/project.entity';

export type UpdateProjectUseCaseRequest = {
  projectId: string;
  userId: string;
  name?: string;
  status?: ProjectStatus;
  segment?: Segment;
  hypothesis?: Hypothesis;
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
    createdAt: Date;
    updatedAt: Date;
  };
};



