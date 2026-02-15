// Dependency Injection symbols for Comments module (Frontend)
export const COMMENT_TYPES = {
  // Use Cases
  StartFetchAndWaitUseCase: Symbol.for('StartFetchAndWaitUseCase'),
  GetFetchStatusUseCase: Symbol.for('GetFetchStatusUseCase'),
  GetCommentsUseCase: Symbol.for('GetCommentsUseCase'),
  DeleteSourceUseCase: Symbol.for('DeleteSourceUseCase'),

  // Presenters
  CommentsPresenter: Symbol.for('CommentsPresenter'),

  // Repositories
  CommentsHttpRepository: Symbol.for('CommentsHttpRepository'),
};