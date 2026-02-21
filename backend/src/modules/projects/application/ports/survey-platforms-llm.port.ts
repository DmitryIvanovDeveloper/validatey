import ResultEx from '../../../../infrastructure/result/result';
import { AiModuleError } from '../../../ai/domain/errors/ai.error';

export interface SurveyPlatformsLlmInput {
  targetSegment?: string | null;
  productHypothesis?: string | null;
  hypothesisAssumptions?: string[] | null;
  targetAudience?: string | null;
  marketContext?: string | null;
  productCost?: number | null;
}

export interface SurveyPlatformSuggestion {
  platform: string;
  subplatform?: string;
  reason: string;
  postingStrategy: string;
  expectedReach: string;
  post: string;
}

export interface SurveyPlatformsLlmPort {
  suggest(input: SurveyPlatformsLlmInput): Promise<ResultEx<SurveyPlatformSuggestion[], AiModuleError>>;
}
