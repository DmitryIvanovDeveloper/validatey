import { Container } from 'inversify';
import { TYPES } from './types';
import type { FeedbackRepositoryPort } from '../../application/ports/feedback-repository.port';
import { SubmitFeedbackUseCase } from '../../application/use-cases/submit-feedback.use-case';
import { ListFeedbackUseCase } from '../../application/use-cases/list-feedback.use-case';
import { SupabaseFeedbackRepository } from '../repositories/supabase-feedback.repository';

export function bindFeedback(container: Container): void {
  container.bind<FeedbackRepositoryPort>(TYPES.FeedbackRepositoryPort).to(SupabaseFeedbackRepository);
  container.bind<SubmitFeedbackUseCase>(TYPES.SubmitFeedbackUseCase).to(SubmitFeedbackUseCase);
  container.bind<ListFeedbackUseCase>(TYPES.ListFeedbackUseCase).to(ListFeedbackUseCase);
}
