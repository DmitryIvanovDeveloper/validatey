import { createApp } from 'vue';
import App from './App.vue';
import { router } from './infrastructure/router/router';
import './infrastructure/bootstrap/container'; // Initialize DI container
import { userContextService } from './shared/services/user-context.service';

import './styles/main.css'; // Import global styles

// Инициализируем user ID при загрузке приложения
// Создаём временный ID для анонимных пользователей или загружаем сохранённый
userContextService.getOrCreateUserId();

const app = createApp(App);

app.use(router);

app.mount('#app');
