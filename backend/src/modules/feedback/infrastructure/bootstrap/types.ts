export const TYPES = {
  FeedbackRepositoryPort: Symbol.for('FeedbackRepositoryPort'),
  FeedbackAnalysisLlmPort: Symbol.for('FeedbackAnalysisLlmPort'),
  SubmitFeedbackUseCase: Symbol.for('SubmitFeedbackUseCase'),
  ListFeedbackUseCase: Symbol.for('ListFeedbackUseCase'),
  AnalyzeFeedbackUseCase: Symbol.for('AnalyzeFeedbackUseCase'),
} as const;
