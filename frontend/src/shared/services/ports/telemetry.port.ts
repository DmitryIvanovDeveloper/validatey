export interface TelemetryPort {
  trackPageView(page: string, metadata?: Record<string, any>): void;
  trackEvent(eventName: string, metadata?: Record<string, any>): void;
  trackDropoff(page: string, step: string, metadata?: Record<string, any>): void;
  trackError(error: Error, properties?: Record<string, any>): void;
}

