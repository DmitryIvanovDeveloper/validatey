import { Container } from 'inversify';
import { COMMENT_TYPES } from '../../types';

// Application
import { StartFetchAndWaitUseCase } from '../../application/use-cases/start-fetch-and-wait.usecase';
import { GetFetchStatusUseCase } from '../../application/use-cases/get-fetch-status.usecase';
import { GetCommentsUseCase } from '../../application/use-cases/get-comments.usecase';
import { DeleteSourceUseCase } from '../../application/use-cases/delete-source.usecase';

// Interface Adapters
import { CommentsPresenter } from '../../interface-adapters/presenters/comments.presenter';

// Infrastructure
import { CommentsHttpRepository } from '../repositories/comments.http.repository';

export function bindComments(container: Container): void {
  // Use Cases
  container.bind<StartFetchAndWaitUseCase>(COMMENT_TYPES.StartFetchAndWaitUseCase).to(StartFetchAndWaitUseCase);
  container.bind<GetFetchStatusUseCase>(COMMENT_TYPES.GetFetchStatusUseCase).to(GetFetchStatusUseCase);
  container.bind<GetCommentsUseCase>(COMMENT_TYPES.GetCommentsUseCase).to(GetCommentsUseCase);
  container.bind<DeleteSourceUseCase>(COMMENT_TYPES.DeleteSourceUseCase).to(DeleteSourceUseCase);

  // Presenters
  container.bind<CommentsPresenter>(COMMENT_TYPES.CommentsPresenter).to(CommentsPresenter);

  // Repositories
  container.bind(COMMENT_TYPES.CommentsHttpRepository).to(CommentsHttpRepository);
}