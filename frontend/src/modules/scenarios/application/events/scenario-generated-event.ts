import { IEvent } from '../../../../infrastructure/event-bus/ports/event-handler.port';

export class ScenarioGeneratedEvent implements IEvent {
  constructor(
    public readonly scenarioId: string,
    public readonly projectId: string
  ) {}
}

