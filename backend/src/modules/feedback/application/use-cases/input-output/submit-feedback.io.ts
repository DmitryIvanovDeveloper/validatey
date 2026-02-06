import type { FeedbackType } from '../../../domain/entities/feedback.entity';

export type SubmitFeedbackUseCaseRequest = {
  type: FeedbackType;
  text: string;
  screenshotUrl?: string | null;
  pageUrl?: string | null;
  callerUserId: string;
};

export type SubmitFeedbackUseCaseResponse = {
  id: string;
};
