import { injectable, inject } from 'inversify';
import { TelemetryPort } from './ports/telemetry.port';
import type { HttpClientPort } from '../../infrastructure/http/ports/http-client.port';
import { API_CONFIG } from '../../infrastructure/config/api.config';
import { TYPES as ROOT_TYPES } from '../../infrastructure/bootstrap/types';

@injectable()
export class TelemetryService implements TelemetryPort {
  constructor(
    @inject(ROOT_TYPES.HttpClient)
    private readonly _httpClient: HttpClientPort
  ) {}

  trackPageView(page: string, metadata?: Record<string, any>): void {
    // Отправка в фоне, не блокируя UI
    this._httpClient.post(API_CONFIG.ENDPOINTS.TELEMETRY, {
      type: 'page_view',
      page,
      metadata,
      timestamp: new Date().toISOString()
    }).catch(error => {
      // Тихо игнорируем ошибки телеметрии, чтобы не блокировать UI
      if (process.env.NODE_ENV === 'development') {
        console.debug('Failed to track page view:', error);
      }
    });
  }

  trackEvent(eventName: string, metadata?: Record<string, any>): void {
    // Отправка в фоне, не блокируя UI
    this._httpClient.post(API_CONFIG.ENDPOINTS.TELEMETRY, {
      type: 'event',
      eventName,
      metadata,
      timestamp: new Date().toISOString()
    }).catch(error => {
      // Тихо игнорируем ошибки телеметрии, чтобы не блокировать UI
      if (process.env.NODE_ENV === 'development') {
        console.debug('Failed to track event:', error);
      }
    });
  }

  trackDropoff(page: string, step: string, metadata?: Record<string, any>): void {
    // Отправка в фоне, не блокируя UI
    this._httpClient.post(API_CONFIG.ENDPOINTS.TELEMETRY, {
      type: 'dropoff',
      page,
      step,
      metadata,
      timestamp: new Date().toISOString()
    }).catch(error => {
      // Тихо игнорируем ошибки телеметрии, чтобы не блокировать UI
      if (process.env.NODE_ENV === 'development') {
        console.debug('Failed to track dropoff:', error);
      }
    });
  }

  trackError(error: Error, properties?: Record<string, any>): void {
    this._httpClient.post(API_CONFIG.ENDPOINTS.TELEMETRY, {
      type: 'error',
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      properties,
      timestamp: new Date().toISOString()
    }).catch(err => {
      console.error('Failed to track error:', err);
    });
  }
}

