import ResultEx from '../../../../infrastructure/result/result';
import type { Feedback } from '../../domain/entities/feedback.entity';

export interface FeedbackRepositoryPort {
  save(feedback: Feedback): Promise<ResultEx<Feedback, Error>>;
  list(): Promise<ResultEx<Feedback[], Error>>;
}
