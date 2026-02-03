# Validatey Frontend

Frontend приложение для Validatey - платформы для валидации продуктовых гипотез через опросы.

## Технологический стек

- **Vue 3** - основной фреймворк
- **TypeScript** - типизация
- **Vite** - сборщик
- **Vue Router** - роутинг
- **Inversify** - DI контейнер
- **Result Pattern** - обработка ошибок
- **Tailwind CSS** - стилизация
- **Axios** - HTTP клиент

## Архитектура

Проект построен на принципах **Clean Architecture**:

```
src/
├── infrastructure/    # Инфраструктура (DI, HTTP, Logging, Router)
├── modules/          # Бизнес-модули
│   ├── pm-console/   # PM-консоль (создание проектов, управление)
│   └── respondent-ui/# UI для респондентов (формы опросов)
└── shared/           # Общие компоненты и утилиты
```

## Установка и запуск

```bash
# Установка зависимостей
npm install

# Разработка
npm run dev

# Сборка для production
npm run build

# Предпросмотр production сборки
npm run preview
```

## Скрипты

- `npm run dev` - запуск dev-сервера
- `npm run build` - сборка для production
- `npm run preview` - предпросмотр production сборки
- `npm run type-check` - проверка типов TypeScript
- `npm run lint` - линтинг кода
- `npm run test` - запуск тестов
- `npm run validate:all` - проверка типов, линтинг и тесты

## Структура модулей

Каждый модуль следует Clean Architecture:

```
modules/[module-name]/
├── domain/              # Бизнес-логика (entities, value objects)
├── application/         # Use cases, ports, models
├── infrastructure/      # Реализации портов (repositories, services)
└── interface-adapters/  # Presenters, views (Vue компоненты)
```

## Environment Variables

Создайте файл `.env` в корне проекта (см. `.env.example`):

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

Авторизация через Google идёт через бэкенд; ключи Supabase нужны только на бэкенде.