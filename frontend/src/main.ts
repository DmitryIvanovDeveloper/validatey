import { createApp } from 'vue';
import App from './App.vue';
import { router } from './infrastructure/router/router';
import './infrastructure/bootstrap/container'; // Initialize DI container
import { sessionManager } from './shared/services/session-manager';

import './styles/main.css'; // Import global styles

// Initialize session manager early (before router checks)
(async () => {
  try {
    console.log('🔐 MAIN: Initializing session manager...');
    await sessionManager.initialize();
    console.log('🔐 MAIN: Session manager initialized');
  } catch (error) {
    console.error('🔐 MAIN: Failed to initialize session manager:', error);
  }

  const app = createApp(App);
  app.use(router);
  app.mount('#app');
})();
