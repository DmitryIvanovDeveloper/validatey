import ResultEx from '../../../../infrastructure/result/result';
import type { FeedbackAnalysis } from '../../domain/value-objects/feedback-analysis.vo';
import type { FeedbackAnalysisError } from '../../domain/errors/feedback.error';

export interface FeedbackItemForAnalysis {
  type: string;
  text: string;
}

export interface FeedbackAnalysisLlmPort {
  analyze(items: FeedbackItemForAnalysis[]): Promise<ResultEx<FeedbackAnalysis, FeedbackAnalysisError>>;
}
