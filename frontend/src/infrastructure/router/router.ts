import { createRouter, createWebHistory } from 'vue-router';
import { routes } from './routes';
import { tokenGuard } from './middleware/token-guard';

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(tokenGuard);
