export type TelemetryEventType = 'page_view' | 'event' | 'dropoff' | 'error';

export interface TelemetryEvent {
  readonly id: string;
  readonly type: TelemetryEventType;
  readonly page: string | null;
  readonly eventName: string | null;
  readonly step: string | null;
  readonly metadata: Record<string, any>;
  readonly timestamp: Date;
  readonly createdAt: Date;
}

export class TelemetryEventEntity {
  private constructor(
    public readonly id: string,
    public readonly type: TelemetryEventType,
    public readonly page: string | null,
    public readonly eventName: string | null,
    public readonly step: string | null,
    public readonly metadata: Record<string, any>,
    public readonly timestamp: Date,
    public readonly createdAt: Date
  ) {}

  static create(
    type: TelemetryEventType,
    page?: string,
    eventName?: string,
    step?: string,
    metadata?: Record<string, any>,
    timestamp?: Date
  ): TelemetryEventEntity {
    if (type === 'event' && !eventName) {
      throw new Error('eventName is required for event type');
    }
    if (type === 'dropoff' && !step) {
      throw new Error('step is required for dropoff type');
    }

    const now = new Date();
    return new TelemetryEventEntity(
      this.generateId(),
      type,
      page || null,
      eventName || null,
      step || null,
      metadata || {},
      timestamp || now,
      now
    );
  }

  static fromData(data: TelemetryEvent): TelemetryEventEntity {
    return new TelemetryEventEntity(
      data.id,
      data.type,
      data.page,
      data.eventName,
      data.step,
      data.metadata,
      data.timestamp,
      data.createdAt
    );
  }

  toData(): TelemetryEvent {
    return {
      id: this.id,
      type: this.type,
      page: this.page,
      eventName: this.eventName,
      step: this.step,
      metadata: this.metadata,
      timestamp: this.timestamp,
      createdAt: this.createdAt,
    };
  }

  private static generateId(): string {
    return `tel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}



