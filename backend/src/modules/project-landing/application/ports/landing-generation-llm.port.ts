import Result from '../../../../infrastructure/result/result';

export interface LandingGenerationLLMRequest {
  prompt: string;
}

export interface LandingGenerationLLMResponse {
  html: string;
  css?: string;
  js?: string;
  metadata?: {
    headline?: string;
    cta_text?: string;
    target_audience?: string;
    estimatedConversionRate?: string;
    targetAudienceFit?: string;
    mobileOptimized?: boolean;
    loadingSpeed?: string;
    accessibilityScore?: string;
  };
}

export interface LandingGenerationLLMPort {
  generateLanding(request: LandingGenerationLLMRequest): Promise<Result<LandingGenerationLLMResponse, Error>>;
}