import { Container } from 'inversify';
import { COMMENT_TYPES } from '../../types';
import { TYPES as RESEARCH_TYPES } from '../../../research/infrastructure/bootstrap/types';

// Application
import { FetchCommentsUseCase } from '../../application/use-cases/fetch-comments.usecase';
import { GetCommentsUseCase } from '../../application/use-cases/get-comments.usecase';
import { GetFetchStatusUseCase } from '../../application/use-cases/get-fetch-status.usecase';
import { GetCommentByIdUseCase } from '../../application/use-cases/get-comment-by-id.usecase';
import { StartFetchCommandHandler } from '../../application/commands/start-fetch.command-handler';
import { DeleteSourceCommandHandler } from '../../application/commands/delete-source.command-handler';
import { GetCommentsQueryHandler } from '../../application/queries/get-comments.query-handler';
import { GetFetchStatusQueryHandler } from '../../application/queries/get-fetch-status.query-handler';
import { GetCommentByIdQueryHandler } from '../../application/queries/get-comment-by-id.query-handler';
import { GetPatternCommentsUseCase } from '../../application/use-cases/get-pattern-comments.use-case';

// Infrastructure
import { SupabaseCommentRepository } from '../repositories/supabase-comment.repository';
import { SupabaseCommentSourceRepository } from '../repositories/supabase-comment-source.repository';
import { SupabaseFetchJobRepository } from '../repositories/supabase-fetch-job.repository';
import { InMemoryFetchStatusReadModel } from '../repositories/in-memory-fetch-status-read-model';
import { CommentFetcherRouter } from '../fetchers/comment-fetcher.router';
import { RedditFetcher } from '../fetchers/reddit-fetcher';
import { RedditSearchFetcher } from '../fetchers/reddit-search-fetcher';
import { HackerNewsFetcher } from '../fetchers/hacker-news-fetcher';
import { HackerNewsAlgoliaFetcher } from '../fetchers/hacker-news-algolia-fetcher';
import { LinkedInFetcher } from '../fetchers/linkedin-fetcher';
import { FetchStatusProjection } from '../projections/fetch-status.projection';

// Pattern Analysis
import { KeywordCommentPatternAnalyzerAdapter } from '../services/keyword-comment-pattern-analyzer.adapter';
import { SupabasePatternRulesRepository } from '../repositories/supabase-pattern-rules.repository';

// Interface Adapters
import { CommentController } from '../../interface-adapters/controllers/comment.controller';

export function bindComments(container: Container): void {
  // Use Cases
  container.bind<FetchCommentsUseCase>(COMMENT_TYPES.FetchCommentsUseCase).to(FetchCommentsUseCase);
  container.bind<GetCommentsUseCase>(COMMENT_TYPES.GetCommentsUseCase).to(GetCommentsUseCase);
  container.bind<GetFetchStatusUseCase>(COMMENT_TYPES.GetFetchStatusUseCase).to(GetFetchStatusUseCase);
  container.bind<GetCommentByIdUseCase>(COMMENT_TYPES.GetCommentByIdUseCase).to(GetCommentByIdUseCase);
  container.bind<GetPatternCommentsUseCase>(COMMENT_TYPES.GetPatternCommentsUseCase).to(GetPatternCommentsUseCase);

  // Command Handlers
  container.bind<StartFetchCommandHandler>(COMMENT_TYPES.StartFetchCommandHandler).to(StartFetchCommandHandler);
  container.bind<DeleteSourceCommandHandler>(COMMENT_TYPES.DeleteSourceCommandHandler).to(DeleteSourceCommandHandler);

  // Query Handlers
  container.bind<GetCommentsQueryHandler>(COMMENT_TYPES.GetCommentsQueryHandler).to(GetCommentsQueryHandler);
  container.bind<GetFetchStatusQueryHandler>(COMMENT_TYPES.GetFetchStatusQueryHandler).to(GetFetchStatusQueryHandler);
  container.bind<GetCommentByIdQueryHandler>(COMMENT_TYPES.GetCommentByIdQueryHandler).to(GetCommentByIdQueryHandler);

  // Repositories
  container.bind(COMMENT_TYPES.CommentRepository).to(SupabaseCommentRepository);
  container.bind(COMMENT_TYPES.CommentSourceRepository).to(SupabaseCommentSourceRepository);
  container.bind(COMMENT_TYPES.FetchJobRepository).to(SupabaseFetchJobRepository);
  container.bind(COMMENT_TYPES.FetchStatusReadModel).to(InMemoryFetchStatusReadModel);

  // Fetchers
  container.bind(COMMENT_TYPES.CommentFetcher).to(CommentFetcherRouter);
  container.bind(COMMENT_TYPES.RedditFetcher).to(RedditFetcher);
  container.bind(COMMENT_TYPES.RedditSearchFetcher).to(RedditSearchFetcher);
  container.bind(COMMENT_TYPES.HackerNewsFetcher).to(HackerNewsFetcher);
  container.bind(COMMENT_TYPES.HackerNewsAlgoliaFetcher).to(HackerNewsAlgoliaFetcher);
  container.bind(COMMENT_TYPES.LinkedInFetcher).to(LinkedInFetcher);

  // Projections
  container.bind(COMMENT_TYPES.FetchStatusProjection).to(FetchStatusProjection);

  // Pattern Analysis
  container.bind(COMMENT_TYPES.CommentPatternAnalyzer).to(KeywordCommentPatternAnalyzerAdapter);
  container.bind(COMMENT_TYPES.PatternRulesRepository).to(SupabasePatternRulesRepository);

  // Controllers
  container.bind<CommentController>(COMMENT_TYPES.CommentController).to(CommentController);
}