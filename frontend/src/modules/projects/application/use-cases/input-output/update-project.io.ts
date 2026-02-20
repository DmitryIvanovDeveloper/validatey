import { Segment } from '../../../domain/value-objects/segment.vo';
import { Hypothesis } from '../../../domain/value-objects/hypothesis.vo';
import { ProjectStatus, MarketContext } from '../../../domain/entities/project.entity';

export type UpdateProjectUseCaseRequest = {
  projectId: string;
  updates: {
    name?: string;
    segment?: Segment;
    hypothesis?: Hypothesis;
    marketContext?: MarketContext | null;
    status?: ProjectStatus;
    scenarioTemplateSlug?: string | null;
    consentText?: string | null;
    dataUsageText?: string | null;
    privacyPolicyUrl?: string | null;
    termsOfServiceUrl?: string | null;
    publicAccessEnabled?: boolean;
    publicSlug?: string | null;
    maxPublicResponses?: number | null;
    requirePublicEmail?: boolean;
    captchaEnabled?: boolean;
  };
};

export type UpdateProjectUseCaseResponse = {
  project: {
    id: string;
    name: string;
    segment: {
      description: string;
      demographics: Record<string, unknown>;
    } | null;
    hypothesis: {
      description: string;
      assumptions: Array<{ id: string; text: string }>;
    } | null;
    marketContext: MarketContext | null;
    status: string;
    createdAt: string;
    updatedAt: string;
    publicAccessEnabled?: boolean;
    publicSlug?: string | null;
    maxPublicResponses?: number | null;
    requirePublicEmail?: boolean;
    captchaEnabled?: boolean;
  };
};



