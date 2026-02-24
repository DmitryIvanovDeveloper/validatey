import { injectable, inject } from 'inversify';
import { IAsyncEventHandler } from '../../../../infrastructure/event-bus/ports/event-handler.port';
import { ResearchDataCollectionStartedEvent } from '../../domain/events/research-data-collection-started.event';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { ResearchPresenter } from '../../interface-adapters/presenters/research.presenter';

@injectable()
export class ResearchDataCollectionStartedEventHandler implements IAsyncEventHandler<ResearchDataCollectionStartedEvent> {
  constructor(
    @inject(TYPES.ResearchPresenter)
    private readonly _researchPresenter: ResearchPresenter
  ) {}

  canHandle(event: ResearchDataCollectionStartedEvent): boolean {
    return event instanceof ResearchDataCollectionStartedEvent;
  }

  async handleAsync(event: ResearchDataCollectionStartedEvent): Promise<void> {
    // This will be called after comments fetch started, so we can set research loading
    await this._researchPresenter.setResearchLoading(event.projectId, true);
    await this._researchPresenter.setCommentsOnlyLoading(event.projectId, false);
  }
}