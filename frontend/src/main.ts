import { createApp } from 'vue';
import App from './App.vue';
import { router } from './infrastructure/router/router';
import './infrastructure/bootstrap/container'; // Initialize DI container
import { userContextService } from './shared/services/user-context.service';

import './styles/main.css'; // Import global styles

// User ID will be initialized when session is loaded in AppLayout

const app = createApp(App);

app.use(router);

app.mount('#app');
