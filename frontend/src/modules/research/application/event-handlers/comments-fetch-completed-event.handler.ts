import { injectable, inject } from 'inversify';
import { IAsyncEventHandler } from '../../../../infrastructure/event-bus/ports/event-handler.port';
import { CommentsFetchCompletedEvent } from '../../../comments/domain/events/comments-fetch-completed.event';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { ResearchPresenter } from '../../interface-adapters/presenters/research.presenter';

@injectable()
export class CommentsFetchCompletedEventHandler implements IAsyncEventHandler<CommentsFetchCompletedEvent> {
  constructor(
    @inject(TYPES.ResearchPresenter)
    private readonly _researchPresenter: ResearchPresenter
  ) {}

  canHandle(event: CommentsFetchCompletedEvent): boolean {
    return event instanceof CommentsFetchCompletedEvent;
  }

  async handleAsync(event: CommentsFetchCompletedEvent): Promise<void> {
    await this._researchPresenter.setCommentsOnlyLoading(event.projectId, false);
    await this._researchPresenter.setCommentsFetchStatus(event.projectId, false);
    await this._researchPresenter.setResearchLoading(event.projectId, false);
  }
}