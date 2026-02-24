import { injectable, inject } from 'inversify';
import { IAsyncEventHandler } from '../../../../infrastructure/event-bus/ports/event-handler.port';
import { ResearchStartedEvent } from '../../../research/domain/events/research-started.event';
import { COMMENT_TYPES } from '../../types';
import { CommentsPresenter } from '../../interface-adapters/presenters/comments.presenter';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { EventBusPort } from '../../../../infrastructure/event-bus/ports/event-bus.port';
import { ResearchDataCollectionStartedEvent } from '../../../research/domain/events/research-data-collection-started.event';

@injectable()
export class ResearchStartedEventHandler implements IAsyncEventHandler<ResearchStartedEvent> {
  constructor(
    @inject(COMMENT_TYPES.CommentsPresenter)
    private readonly _commentsPresenter: CommentsPresenter,
    @inject(ROOT_TYPES.EventBus)
    private readonly _eventBus: EventBusPort
  ) {}

  canHandle(event: ResearchStartedEvent): boolean {
    return event instanceof ResearchStartedEvent;
  }

  async handleAsync(event: ResearchStartedEvent): Promise<void> {
    // Start comments fetching first
    await this._commentsPresenter.startFetch(event.projectId);

    // After comments fetch started, signal that research data collection can begin
    await this._eventBus.publishAsync(new ResearchDataCollectionStartedEvent(event.projectId));
  }
}