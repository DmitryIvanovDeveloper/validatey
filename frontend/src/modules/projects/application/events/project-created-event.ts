import { IEvent } from '../../../../infrastructure/event-bus/ports/event-handler.port';

export class ProjectCreatedEvent implements IEvent {
  constructor(public readonly projectId: string) {}
}



