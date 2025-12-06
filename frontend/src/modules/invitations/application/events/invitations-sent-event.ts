import { IEvent } from '../../../../infrastructure/event-bus/ports/event-handler.port';

export class InvitationsSentEvent implements IEvent {
  constructor(
    public readonly projectId: string,
    public readonly count: number
  ) {}
}

