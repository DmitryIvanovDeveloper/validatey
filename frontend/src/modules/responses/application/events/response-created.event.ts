import type { Response } from '../../domain/entities/response.entity';

export class ResponseCreatedEvent {
  constructor(
    public readonly response: Response,
    public readonly timestamp: Date = new Date()
  ) {}
}