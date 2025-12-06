import { createRouter, createWebHistory } from 'vue-router';
import { routes } from './routes';
import { tokenGuard } from './middleware/token-guard';
import { setupTelemetryMiddleware } from './middleware/telemetry-middleware';

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(tokenGuard);
setupTelemetryMiddleware(router);
