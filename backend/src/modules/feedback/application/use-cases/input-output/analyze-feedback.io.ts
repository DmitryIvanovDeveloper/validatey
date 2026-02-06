import type { FeedbackAnalysis } from '../../../domain/entities/feedback-analysis.entity';

export type AnalyzeFeedbackUseCaseRequest = {
  callerUserId: string;
};

export type AnalyzeFeedbackUseCaseResponse = {
  analysis: FeedbackAnalysis;
};
