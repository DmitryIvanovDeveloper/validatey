import ResultEx from '../../../../infrastructure/result/result';
import type { FeedbackAnalysis } from '../../domain/entities/feedback-analysis.entity';
import type { FeedbackAnalysisError } from '../../domain/errors/feedback.error';

export interface FeedbackItemForAnalysis {
  type: string;
  text: string;
}

export interface FeedbackAnalysisLlmPort {
  analyze(items: FeedbackItemForAnalysis[]): Promise<ResultEx<FeedbackAnalysis, FeedbackAnalysisError>>;
}
