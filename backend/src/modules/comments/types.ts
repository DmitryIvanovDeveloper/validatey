// Dependency Injection symbols for Comments module
export const COMMENT_TYPES = {
  // Use Cases
  FetchCommentsUseCase: Symbol.for('FetchCommentsUseCase'),
  GetCommentsUseCase: Symbol.for('GetCommentsUseCase'),
  GetFetchStatusUseCase: Symbol.for('GetFetchStatusUseCase'),
  GetCommentByIdUseCase: Symbol.for('GetCommentByIdUseCase'),
  GetPatternCommentsUseCase: Symbol.for('GetPatternCommentsUseCase'),

  // Command Handlers
  StartFetchCommandHandler: Symbol.for('StartFetchCommandHandler'),
  DeleteSourceCommandHandler: Symbol.for('DeleteSourceCommandHandler'),

  // Query Handlers
  GetCommentsQueryHandler: Symbol.for('GetCommentsQueryHandler'),
  GetFetchStatusQueryHandler: Symbol.for('GetFetchStatusQueryHandler'),
  GetCommentByIdQueryHandler: Symbol.for('GetCommentByIdQueryHandler'),

  // Repositories
  CommentRepository: Symbol.for('CommentRepository'),
  CommentSourceRepository: Symbol.for('CommentSourceRepository'),
  FetchJobRepository: Symbol.for('FetchJobRepository'),
  FetchStatusReadModel: Symbol.for('FetchStatusReadModel'),

  // Fetchers
  CommentFetcher: Symbol.for('CommentFetcher'), // Router
  RedditFetcher: Symbol.for('RedditFetcher'),
  RedditSearchFetcher: Symbol.for('RedditSearchFetcher'),
  HackerNewsFetcher: Symbol.for('HackerNewsFetcher'),
  HackerNewsAlgoliaFetcher: Symbol.for('HackerNewsAlgoliaFetcher'),
  LinkedInFetcher: Symbol.for('LinkedInFetcher'),

  // Projections
  FetchStatusProjection: Symbol.for('FetchStatusProjection'),

  // Pattern Analysis
  CommentPatternAnalyzer: Symbol.for('CommentPatternAnalyzer'),
  PatternRulesRepository: Symbol.for('PatternRulesRepository'),

  // Controllers
  CommentController: Symbol.for('CommentController'),
};