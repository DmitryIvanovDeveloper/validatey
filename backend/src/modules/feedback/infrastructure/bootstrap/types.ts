export const TYPES = {
  FeedbackRepository: Symbol.for('FeedbackRepository'),
  FeedbackAnalysisLlm: Symbol.for('FeedbackAnalysisLlm'),
  SubmitFeedbackUseCase: Symbol.for('SubmitFeedbackUseCase'),
  ListFeedbackUseCase: Symbol.for('ListFeedbackUseCase'),
  AnalyzeFeedbackUseCase: Symbol.for('AnalyzeFeedbackUseCase'),
} as const;
