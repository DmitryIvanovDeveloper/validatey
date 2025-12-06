# Требования к Backend API для Frontend

## 📋 Обзор

Данный документ описывает все требования к backend API, которые необходимы для полноценной работы frontend приложения Validatey.

## 🔗 Base URL

```
http://localhost:3000/api
```

## 🔐 Обязательные HTTP заголовки

### `x-user-id`

**Все HTTP запросы** должны содержать заголовок `x-user-id` с идентификатором пользователя.

- **Формат:** UUID v4 или другой уникальный идентификатор строкового типа
- **Обязательность:** Да, во всех запросах
- **Источник:** 
  - Для аутентифицированных пользователей - ID из системы авторизации
  - Для анонимных пользователей - временный UUID, генерируемый frontend и сохраняемый в localStorage
- **Использование:** 
  - Трекинг действий пользователя
  - Аудит и логирование
  - Rate limiting на уровне пользователя
  - Персонализация (если требуется)

**Пример:**
```
x-user-id: 550e8400-e29b-41d4-a716-446655440000
```

**Исключения:**
- Нет исключений - заголовок обязателен для всех endpoints

## 📡 API Endpoints

### 1. Projects (Проекты)

#### `POST /projects`
**Создание нового проекта**

**Request:**
```json
{
  "name": "string",
  "segment": {
    "description": "string",
    "demographics": "object"
  } | null,
  "hypothesis": {
    "description": "string",
    "assumptions": ["string"]
  } | null,
  "status": "draft" | "active" | "completed" | "archived"
}
```

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "segment": {
    "description": "string",
    "demographics": {}
  } | null,
  "hypothesis": {
    "description": "string",
    "assumptions": ["string"]
  } | null,
  "status": "string",
  "createdAt": "ISO 8601 string",
  "updatedAt": "ISO 8601 string"
}
```

#### `GET /projects`
**Список всех проектов**

**Response:**
```json
[
  {
    "id": "string",
    "name": "string",
    "status": "string",
    "createdAt": "ISO 8601 string",
    "updatedAt": "ISO 8601 string"
  }
]
```

#### `GET /projects/:id`
**Получение проекта по ID**

**Response:** (аналогично POST /projects)

#### `PUT /projects/:id`
**Обновление проекта**

**Request:** (частичное обновление, все поля опциональны)
```json
{
  "name": "string",
  "segment": {
    "description": "string",
    "demographics": {}
  } | null,
  "hypothesis": {
    "description": "string",
    "assumptions": ["string"]
  } | null,
  "status": "string"
}
```

**Response:** (аналогично POST /projects)

#### `DELETE /projects/:id`
**Удаление проекта**

**Response:** `204 No Content`

---

### 2. Scenarios (Сценарии)

#### `POST /projects/:projectId/scenarios/generate`
**Генерация сценария через LLM**

**Request:**
```json
{
  "prompt": "string" // опционально, если не указан - генерируется на основе гипотезы проекта
}
```

**Response:**
```json
{
  "id": "string",
  "projectId": "string",
  "content": "string",
  "version": 1,
  "status": "draft" | "generated" | "approved" | "rejected",
  "createdAt": "ISO 8601 string",
  "updatedAt": "ISO 8601 string"
}
```

**Особенности:**
- Должен быть асинхронным (возвращать task ID или использовать WebSocket)
- Генерация должна быть в очереди задач
- Поддержка версионности (каждая новая генерация увеличивает version)

#### `GET /projects/:projectId/scenarios`
**Список всех сценариев проекта**

**Response:**
```json
[
  {
    "id": "string",
    "projectId": "string",
    "content": "string",
    "version": 1,
    "status": "string",
    "createdAt": "ISO 8601 string",
    "updatedAt": "ISO 8601 string"
  }
]
```

#### `GET /projects/:projectId/scenarios/:scenarioId`
**Получение конкретного сценария**

**Response:** (аналогично POST generate)

#### `PUT /projects/:projectId/scenarios/:scenarioId`
**Обновление сценария (ручное редактирование)**

**Request:**
```json
{
  "content": "string"
}
```

**Response:** (аналогично POST generate)
- При обновлении должен создаваться новая версия (version++)

---

### 3. Invitations (Приглашения)

#### `POST /projects/:projectId/invitations`
**Создание приглашений**

**Request:**
```json
{
  "emails": ["email1@example.com", "email2@example.com"]
}
```

**Response:**
```json
[
  {
    "id": "string",
    "projectId": "string",
    "token": "string",
    "email": "string",
    "status": "pending" | "sent" | "responded" | "expired",
    "sentAt": "ISO 8601 string" | null,
    "respondedAt": "ISO 8601 string" | null
  }
]
```

**Особенности:**
- Генерация уникального токена для каждого приглашения
- Связь с проектом и сценарием

#### `GET /projects/:projectId/invitations`
**Список приглашений проекта**

**Response:** (аналогично POST)

#### `POST /projects/:projectId/invitations/send`
**Отправка приглашений (рассылка)**

**Request:**
```json
{
  "invitationIds": ["id1", "id2"] // опционально, если пусто - отправляет все pending
}
```

**Response:** `204 No Content`

**Особенности:**
- Асинхронная отправка email (очередь задач)
- Обновление статусов на "sent"
- Генерация survey для каждого приглашения на основе сценария

#### `GET /survey/:token`
**Получение опроса по токену (для респондента)**

**Response:**
```json
{
  "invitation": {
    "id": "string",
    "projectId": "string",
    "token": "string",
    "email": "string",
    "status": "string",
    "sentAt": "ISO 8601 string" | null,
    "respondedAt": "ISO 8601 string" | null
  },
  "survey": {
    "id": "string",
    "token": "string",
    "projectId": "string",
    "questions": [
      {
        "id": "string",
        "type": "scale" | "open" | "audio",
        "text": "string",
        "required": true
      }
    ],
    "status": "pending" | "started" | "completed" | "expired",
    "startedAt": "ISO 8601 string" | null,
    "completedAt": "ISO 8601 string" | null
  }
}
```

**Особенности:**
- Валидация токена (проверка истечения, валидности)
- Генерация вопросов на основе сценария
- Если survey не существует - создаётся на основе сценария проекта

---

### 4. Survey Responses (Ответы на опрос)

#### `POST /survey/:token/submit`
**Отправка ответа на вопрос**

**Request:**
```json
{
  "questionId": "string",
  "value": "string" | number,
  "audioUrl": "string" | null
}
```

**Response:**
```json
{
  "id": "string",
  "questionId": "string",
  "value": "string" | number,
  "audioUrl": "string" | null,
  "timestamp": "ISO 8601 string"
}
```

#### `POST /survey/:token/start`
**Отметить опрос как начатый**

**Request:** (пустой)

**Response:** `204 No Content`

#### `POST /survey/:token/complete`
**Завершить опрос**

**Request:** (пустой)

**Response:** `204 No Content`

**Особенности:**
- После завершения запускается обработка ответов (транскрипция аудио, эмбеддинги, кластеризация)
- Обновление статуса приглашения на "responded"

---

### 5. Reports (Отчёты)

#### `GET /projects/:projectId/report`
**Получение отчёта проекта**

**Response:**
```json
{
  "id": "string",
  "projectId": "string",
  "verdict": "string",
  "verdictType": "positive" | "negative" | "neutral",
  "metrics": {
    "response_rate": 0.75,
    "satisfaction_score": 4.2,
    "nps": 8.5,
    "problem_severity_avg": 3.8,
    "alternatives_frequency": {}
  },
  "clusters": {
    "Cluster1": {
      "size": 45,
      "avg_score": 4.8,
      "characteristics": {}
    }
  },
  "alternatives": ["string"],
  "wtp": 150.50,
  "recommendations": ["string"],
  "generatedAt": "ISO 8601 string"
}
```

**Особенности:**
- Если отчёт не существует - должен быть запущен процесс генерации (очередь задач)
- Генерация включает: транскрипцию аудио, создание эмбеддингов, кластеризацию, расчёт метрик

#### `POST /projects/:projectId/report/generate`
**Принудительная генерация нового отчёта**

**Request:** (пустой)

**Response:** `202 Accepted` (задача в очереди)

#### `GET /projects/:projectId/report/html`
**Экспорт отчёта в HTML**

**Response:** `text/html` (Blob)

#### `GET /projects/:projectId/report/pdf`
**Экспорт отчёта в PDF**

**Response:** `application/pdf` (Blob)

---

### 6. Audio Upload (Загрузка аудио)

#### `POST /audio-upload`
**Загрузка аудио файла**

**Request:** `multipart/form-data`
```
audio: File (Blob)
fileName: string
mimeType: string
```

**Response:**
```json
{
  "url": "string" // URL для доступа к загруженному аудио
}
```

**Особенности:**
- Загрузка в облачное хранилище (S3, Supabase Storage и т.д.)
- Возврат публичного URL для доступа
- Обработка различных форматов (webm, mp3, wav)

---

### 7. Telemetry (Аналитика)

#### `POST /telemetry`
**Отправка телеметрии**

**Request:**
```json
{
  "type": "page_view" | "event" | "dropoff" | "error",
  "page": "string",
  "eventName": "string", // для type: "event"
  "step": "string", // для type: "dropoff"
  "metadata": {},
  "timestamp": "ISO 8601 string"
}
```

**Response:** `204 No Content`

**Особенности:**
- Не должно блокировать UI (быстрый ответ)
- Batch отправка возможна
- Rate limiting

---

## 🔄 Асинхронные задачи (Queues)

Backend должен поддерживать следующие очереди задач:

1. **Генерация сценария (LLM)**
   - Вход: projectId, prompt (опционально)
   - Процесс: вызов LLM API, создание/обновление сценария
   - Уведомление: через WebSocket или polling

2. **Рассылка приглашений**
   - Вход: projectId, invitationIds
   - Процесс: отправка email, обновление статусов
   - Создание survey для каждого приглашения

3. **Обработка ответов**
   - Вход: surveyId, responses
   - Процесс:
     - Транскрипция аудио (если есть)
     - Создание эмбеддингов для текстовых ответов
     - Кластеризация ответов
     - Расчёт метрик (problem severity, WTP, альтернативы)

4. **Генерация отчёта**
   - Вход: projectId
   - Процесс:
     - Агрегация всех ответов
     - Расчёт метрик
     - Кластеризация
     - Генерация рекомендаций (LLM)
     - Создание/обновление отчёта

---

## 📊 Расчёт метрик

### Problem Severity Score
- Агрегация шкал 1-5 от всех респондентов
- Среднее значение, медиана, перцентили

### WTP (Willingness to Pay)
- Извлечение из текстовых ответов (NLP) или отдельные вопросы
- Медиана, перцентили, распределение

### Кластеры
- Использование эмбеддингов для кластеризации
- Группировка похожих ответов
- Определение характеристик каждого кластера

### Альтернативы
- Извлечение упоминаний альтернативных решений из текстовых ответов
- Подсчёт частотности

### Рекомендации
- Rule-based логика на основе метрик
- LLM для генерации текстовых пояснений и рекомендаций

---

## 🔐 Безопасность

### Token-based Access
- Валидация токена приглашения для доступа к опросу
- Проверка истечения токена
- Защита от повторного использования (опционально)

### CSRF Protection
- CSRF токены для форм (если используется session-based auth)
- SameSite cookies

### Rate Limiting
- Ограничение на публичные endpoints (survey, submit)
- Защита от спама и DDoS

### PII Filtering
- Фильтрация персональных данных из ответов перед анализом
- Анонимизация данных

---

## 📝 Форматы данных

### Dates
Все даты в формате ISO 8601: `"2024-01-15T10:30:00.000Z"`

### Status Enums

**ProjectStatus:**
- `"draft"`
- `"active"`
- `"completed"`
- `"archived"`

**ScenarioStatus:**
- `"draft"`
- `"generated"`
- `"approved"`
- `"rejected"`

**InvitationStatus:**
- `"pending"`
- `"sent"`
- `"responded"`
- `"expired"`

**SurveyStatus:**
- `"pending"`
- `"started"`
- `"completed"`
- `"expired"`

**QuestionType:**
- `"scale"` (1-5)
- `"open"` (текстовый ответ)
- `"audio"` (аудио запись)

---

## 🔄 WebSocket / Server-Sent Events (опционально)

Для real-time обновлений:

1. **Статус генерации сценария**
   - `scenario:generating` → `scenario:generated`
   
2. **Статус рассылки**
   - `invitations:sending` → `invitations:sent`
   
3. **Прогресс ответов**
   - `responses:new` → обновление статистики в реальном времени

---

## ❌ Обработка ошибок

### Стандартные HTTP статусы:
- `200 OK` - успешный запрос
- `201 Created` - ресурс создан
- `202 Accepted` - задача принята в очередь
- `204 No Content` - успешно, нет контента
- `400 Bad Request` - неверный запрос
- `401 Unauthorized` - требуется авторизация
- `403 Forbidden` - нет доступа
- `404 Not Found` - ресурс не найден
- `422 Unprocessable Entity` - ошибка валидации
- `429 Too Many Requests` - превышен rate limit
- `500 Internal Server Error` - серверная ошибка

### Формат ошибок:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {} // опционально
  }
}
```

---

## 🚀 Производительность

- **Timeout:** 30 секунд для синхронных операций
- **Retry:** 3 попытки для failed запросов
- **Pagination:** для списков (если > 100 элементов)
- **Caching:** для часто запрашиваемых данных (проекты, отчёты)

---

## 📦 Интеграции

### LLM Service
- Генерация сценариев на основе гипотезы
- Генерация рекомендаций в отчётах
- AI-помощник для формулировки гипотез

### Email Service
- Отправка приглашений
- Напоминания о прохождении опроса

### Storage Service
- Загрузка аудио файлов
- Хранение и доступ к файлам

### Analytics Service
- Обработка ответов (транскрипция, эмбеддинги, кластеризация)
- Расчёт метрик

---

## 🔍 Важные особенности

1. **Idempotency:** Все POST запросы должны быть идемпотентными (повторный запрос с теми же данными не должен создавать дубликаты)

2. **Версионность:** 
   - Сценарии должны поддерживать версии
   - Отчёты должны хранить историю версий

3. **Связь данных:**
   - Project → Scenario → Survey → Response → Report
   - Invitation → Survey → Response
   - Валидация целостности на уровне API

4. **Автоматические процессы:**
   - Создание survey при отправке приглашения
   - Запуск обработки ответов при завершении опроса
   - Автоматическая генерация отчёта при наличии достаточного количества ответов

