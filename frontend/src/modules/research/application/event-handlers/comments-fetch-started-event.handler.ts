import { injectable, inject } from 'inversify';
import { IAsyncEventHandler } from '../../../../infrastructure/event-bus/ports/event-handler.port';
import { CommentsFetchStartedEvent } from '../../../comments/domain/events/comments-fetch-started.event';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { ResearchPresenter } from '../../interface-adapters/presenters/research.presenter';

@injectable()
export class CommentsFetchStartedEventHandler implements IAsyncEventHandler<CommentsFetchStartedEvent> {
  constructor(
    @inject(TYPES.ResearchPresenter)
    private readonly _researchPresenter: ResearchPresenter
  ) {}

  canHandle(event: CommentsFetchStartedEvent): boolean {
    return event instanceof CommentsFetchStartedEvent;
  }

  async handleAsync(event: CommentsFetchStartedEvent): Promise<void> {
    await this._researchPresenter.setCommentsOnlyLoading(event.projectId, true);
    await this._researchPresenter.setCommentsFetchStatus(event.projectId, true);
  }
}