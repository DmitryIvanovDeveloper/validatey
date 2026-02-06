import type { FeedbackAnalysis } from '../../../domain/value-objects/feedback-analysis.vo';

export type AnalyzeFeedbackUseCaseRequest = {
  callerUserId: string;
};

export type AnalyzeFeedbackUseCaseResponse = {
  analysis: FeedbackAnalysis;
};
