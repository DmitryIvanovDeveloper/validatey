import { injectable, inject } from 'inversify';
import { TYPES } from '../../../../infrastructure/bootstrap/types';
import { EventBusPort } from '../../../../infrastructure/event-bus/ports/event-bus.port';
import { COMMENT_TYPES } from '../../types';
import { InMemoryFetchStatusReadModel } from '../repositories/in-memory-fetch-status-read-model';
import {
  FETCH_STARTED_EVENT,
  FETCH_PROGRESS_EVENT,
  FETCH_COMPLETED_EVENT,
  FETCH_FAILED_EVENT,
} from '../../domain/events/event-names';

@injectable()
export class FetchStatusProjection {
  constructor(
    @inject(TYPES.EventBus)
    private readonly _eventBus: EventBusPort,
    @inject(COMMENT_TYPES.FetchStatusReadModel)
    private readonly _readModel: InMemoryFetchStatusReadModel
  ) {
    this._setupEventListeners();
  }

  private _setupEventListeners(): void {
    this._eventBus.on(FETCH_STARTED_EVENT, (payload) => {
      this._readModel.updateFromEvent(FETCH_STARTED_EVENT, payload);
    });

    this._eventBus.on(FETCH_PROGRESS_EVENT, (payload) => {
      this._readModel.updateFromEvent(FETCH_PROGRESS_EVENT, payload);
    });

    this._eventBus.on(FETCH_COMPLETED_EVENT, (payload) => {
      this._readModel.updateFromEvent(FETCH_COMPLETED_EVENT, payload);
    });

    this._eventBus.on(FETCH_FAILED_EVENT, (payload) => {
      this._readModel.updateFromEvent(FETCH_FAILED_EVENT, payload);
    });
  }
}