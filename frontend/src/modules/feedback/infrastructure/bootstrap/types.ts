export const TYPES = {
  FeedbackRepository: Symbol.for('FeedbackRepository'),
  SubmitFeedbackUseCase: Symbol.for('SubmitFeedbackUseCase'),
  ListFeedbackUseCase: Symbol.for('ListFeedbackUseCase'),
  AnalyzeFeedbackUseCase: Symbol.for('AnalyzeFeedbackUseCase'),
  FeedbackPresenter: Symbol.for('FeedbackPresenter'),
} as const;