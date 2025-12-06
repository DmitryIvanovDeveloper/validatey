import { Router } from 'vue-router';
import { TelemetryPort } from '@/shared/services/ports/telemetry.port';
import { container } from '../../bootstrap/container';
import { TYPES } from '../../bootstrap/types';

let telemetryService: TelemetryPort | null = null;

export function setupTelemetryMiddleware(router: Router): void {
  try {
    telemetryService = container.get<TelemetryPort>(TYPES.Telemetry);
  } catch (error) {
    console.warn('Telemetry service not available:', error);
  }

  router.beforeEach((to, from, next) => {
    // Отслеживание загрузки страницы
    if (telemetryService) {
      telemetryService.trackPageView(to.name as string, {
        path: to.path,
        from: from.path,
        timestamp: new Date().toISOString(),
      });
    }
    next();
  });

  router.afterEach((to, from) => {
    // Отслеживание завершения навигации
    if (telemetryService) {
      const navigationTime = performance.now();
      telemetryService.trackEvent('page_load_complete', {
        page: to.name as string,
        path: to.path,
        navigationTime,
      });
    }
  });
}

// Функция для отслеживания дроп-оффов
export function trackDropoff(page: string, step: string, metadata?: Record<string, any>): void {
  if (telemetryService) {
    telemetryService.trackDropoff(page, step, {
      ...metadata,
      timestamp: new Date().toISOString(),
    });
  }
}

// Функция для отслеживания начала опроса
export function trackSurveyStart(token: string): void {
  if (telemetryService) {
    telemetryService.trackEvent('survey_started', {
      token,
      timestamp: new Date().toISOString(),
    });
  }
}

// Функция для отслеживания завершения опроса
export function trackSurveyComplete(token: string, duration: number): void {
  if (telemetryService) {
    telemetryService.trackEvent('survey_completed', {
      token,
      duration,
      timestamp: new Date().toISOString(),
    });
  }
}

// Функция для отслеживания дроп-оффа опроса
export function trackSurveyDropoff(token: string, questionIndex: number, questionId: string): void {
  if (telemetryService) {
    trackDropoff('survey', `question_${questionIndex}`, {
      token,
      questionId,
      questionIndex,
    });
  }
}

