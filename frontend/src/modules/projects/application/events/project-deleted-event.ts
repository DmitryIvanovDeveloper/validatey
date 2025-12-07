import { IEvent } from '../../../../infrastructure/event-bus/ports/event-handler.port';

export class ProjectDeletedEvent implements IEvent {
  constructor(public readonly projectId: string) {}
}


