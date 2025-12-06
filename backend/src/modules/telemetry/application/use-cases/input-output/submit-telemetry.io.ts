export type TelemetryEventType = 'page_view' | 'event' | 'dropoff' | 'error';

export type SubmitTelemetryUseCaseRequest = {
  type: TelemetryEventType;
  page?: string;
  eventName?: string;
  step?: string;
  metadata?: Record<string, any>;
  timestamp?: string;
};

export type SubmitTelemetryUseCaseResponse = {
  success: boolean;
};

