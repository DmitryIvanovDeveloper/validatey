import { Container } from 'inversify';
import { COMMENT_TYPES } from '../../types';

// Application
import { StartFetchAndWaitUseCase } from '../../application/use-cases/start-fetch-and-wait.usecase';
import { GetFetchStatusUseCase } from '../../application/use-cases/get-fetch-status.usecase';
import { GetCommentsUseCase } from '../../application/use-cases/get-comments.usecase';
import { DeleteSourceUseCase } from '../../application/use-cases/delete-source.usecase';
import { ResearchStartedEventHandler } from '../../application/event-handlers/research-started-event.handler';

// Interface Adapters
import { CommentsPresenter } from '../../interface-adapters/presenters/comments.presenter';

// Infrastructure
import { CommentsHttpRepository } from '../repositories/comments.http.repository';
import { CommentPatternHttpRepository } from '../repositories/comment-pattern.http.repository';

// Pattern Analysis
import { GetCommentPatternsUseCase } from '../../application/use-cases/get-comment-patterns.use-case';
import { GetPatternCommentsUseCase } from '../../application/use-cases/get-pattern-comments.use-case';

// Event Bus
import { IAsyncEventHandler } from '../../../../infrastructure/event-bus/ports/event-handler.port';
import { ResearchStartedEvent } from '../../../research/domain/events/research-started.event';

export function bindComments(container: Container): void {
  // Use Cases
  container.bind<StartFetchAndWaitUseCase>(COMMENT_TYPES.StartFetchAndWaitUseCase).to(StartFetchAndWaitUseCase);
  container.bind<GetFetchStatusUseCase>(COMMENT_TYPES.GetFetchStatusUseCase).to(GetFetchStatusUseCase);
  container.bind<GetCommentsUseCase>(COMMENT_TYPES.GetCommentsUseCase).to(GetCommentsUseCase);
  container.bind<DeleteSourceUseCase>(COMMENT_TYPES.DeleteSourceUseCase).to(DeleteSourceUseCase);
  container.bind<GetCommentPatternsUseCase>(COMMENT_TYPES.GetCommentPatternsUseCase).to(GetCommentPatternsUseCase);
  container.bind<GetPatternCommentsUseCase>(COMMENT_TYPES.GetPatternCommentsUseCase).to(GetPatternCommentsUseCase);

  // Presenters
  container.bind<CommentsPresenter>(COMMENT_TYPES.CommentsPresenter).to(CommentsPresenter);

  // Repositories
  container.bind(COMMENT_TYPES.CommentsHttpRepository).to(CommentsHttpRepository);
  container.bind(COMMENT_TYPES.CommentPatternRepository).to(CommentPatternHttpRepository);

  // Event Handlers
  container.bind<IAsyncEventHandler<ResearchStartedEvent>>(COMMENT_TYPES.ResearchStartedEventHandler).to(ResearchStartedEventHandler);
}