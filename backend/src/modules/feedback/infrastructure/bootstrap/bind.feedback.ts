import { Container } from 'inversify';
import { TYPES } from './types';
import type { FeedbackRepositoryPort } from '../../application/ports/feedback-repository.port';
import type { FeedbackAnalysisLlmPort } from '../../application/ports/feedback-analysis-llm.port';
import { SubmitFeedbackUseCase } from '../../application/use-cases/submit-feedback.use-case';
import { ListFeedbackUseCase } from '../../application/use-cases/list-feedback.use-case';
import { AnalyzeFeedbackUseCase } from '../../application/use-cases/analyze-feedback.use-case';
import { SupabaseFeedbackRepository } from '../repositories/supabase-feedback.repository';
import { FeedbackAnalysisLlmAdapter } from '../services/feedback-analysis-llm.adapter';

export function bindFeedback(container: Container): void {
  container.bind<FeedbackRepositoryPort>(TYPES.FeedbackRepositoryPort).to(SupabaseFeedbackRepository);
  container.bind<FeedbackAnalysisLlmPort>(TYPES.FeedbackAnalysisLlmPort).to(FeedbackAnalysisLlmAdapter);
  container.bind<SubmitFeedbackUseCase>(TYPES.SubmitFeedbackUseCase).to(SubmitFeedbackUseCase);
  container.bind<ListFeedbackUseCase>(TYPES.ListFeedbackUseCase).to(ListFeedbackUseCase);
  container.bind<AnalyzeFeedbackUseCase>(TYPES.AnalyzeFeedbackUseCase).to(AnalyzeFeedbackUseCase);
}
