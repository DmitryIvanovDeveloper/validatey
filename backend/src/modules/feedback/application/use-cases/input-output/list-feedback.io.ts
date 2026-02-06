import type { Feedback } from '../../../domain/entities/feedback.entity';

export type ListFeedbackUseCaseRequest = {
  callerUserId: string;
};

export type ListFeedbackUseCaseResponse = {
  feedback: Feedback[];
};
