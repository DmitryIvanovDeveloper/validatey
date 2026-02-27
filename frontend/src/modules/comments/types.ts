// Dependency Injection symbols for Comments module (Frontend)
export const COMMENT_TYPES = {
  // Use Cases
  StartFetchAndWaitUseCase: Symbol.for('StartFetchAndWaitUseCase'),
  GetFetchStatusUseCase: Symbol.for('GetFetchStatusUseCase'),
  GetCommentsUseCase: Symbol.for('GetCommentsUseCase'),
  DeleteSourceUseCase: Symbol.for('DeleteSourceUseCase'),

  // Presenters
  CommentsPresenter: Symbol.for('CommentsPresenter'),
  CommentPatternsPresenter: Symbol.for('CommentPatternsPresenter'),

  // Repositories
  CommentsHttpRepository: Symbol.for('CommentsHttpRepository'),
  CommentPatternRepository: Symbol.for('CommentPatternRepository'),

  // Pattern Analysis Use Case
  GetCommentPatternsUseCase: Symbol.for('GetCommentPatternsUseCase'),
  GetPatternCommentsUseCase: Symbol.for('GetPatternCommentsUseCase'),

  // Event Handlers
  ResearchStartedEventHandler: Symbol.for('IAsyncEventHandler<ResearchStartedEvent>'),
};