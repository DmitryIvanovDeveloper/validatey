# Проверка выполнения плана реализации (IMPLEMENTATION_PLAN.md)

Проверка по коду и структуре проекта. Статус: ✅ сделано | ⚠️ частично | ❌ нет.

---

## Фаза 1

### 1.1 Шаблоны исследований (US-D.1)

| Пункт | Статус | Где проверено |
|-------|--------|----------------|
| 3 шаблона в коде/конфиге (Problem/WTP, Feature, Value Prop) | ✅ | `InMemoryScenarioTemplateRepository`: wtp, feature-demand, value-prop с полными вопросами |
| Шаг «Сценарий» в мастере, выбор шаблона, подстановка вопросов | ✅ | `CreateProjectWizardView.vue`: scenarioSource=template, scenarioTemplates, выбор шаблона подставляет content |
| Валидация структуры при сохранении (опционально) | ⚠️ | Backend: `POST /api/scenarios/validate` есть, UI мастера вызов не делает при сохранении |

### 1.2 Согласие и прозрачность (US-C.1, US-C.2)

| Пункт | Статус | Где проверено |
|-------|--------|----------------|
| Таблица/модель согласия | ✅ | Миграция `005_consents.sql`, модуль consents (entity, repository, use cases) |
| Текст согласия в проекте, API | ✅ | Project: consent_text, template; GetConsentRequirementsUseCase, survey API отдаёт consentRequired/consentText/dataUsageText |
| Экран согласия перед опросом, блок до вопросов | ✅ | `SurveyView.vue`: consent screen, чекбокс, кнопка «Continue», блокировка вопросов до согласия |
| Сохранение факта согласия (API при «Продолжить») | ✅ | `POST /survey/:token/consent`, RecordConsentUseCase, SupabaseConsentRepository |
| Блок «Как мы используем данные» на экране согласия | ✅ | `SurveyView.vue`: dataUsageText, блок "How we use your data" |

### 1.3 Dashboard и метрики по шаблонам

| Пункт | Статус | Где проверено |
|-------|--------|----------------|
| Расчёт метрик по типу шаблона (wtp / feature-demand / value-prop) | ✅ | `CalculateMetricsUseCase`: templateSlug, isWtp/isFeatureDemand/isValueProp, соответствующие метрики |
| Progress/Report UI — метрики по шаблону | ⚠️ | Progress: загрузка данных есть; Report: **mock-данные** (setTimeout), вызов бэкенда calculate-metrics/report не подключён |

---

## Фаза 2

### 2.1 Предупреждение о непригодности вопросов (US-D.3)

| Пункт | Статус | Где проверено |
|-------|--------|----------------|
| Правила валидации по типу шаблона | ✅ | `ValidateScenarioStructureUseCase`: правила по slug (scale и т.д.) |
| API проверки сценария | ✅ | `POST /api/scenarios/validate` (scenarioContent, templateSlug) → warnings |
| UI предупреждения в мастере при сохранении/переходе | ❌ | Фронт не вызывает `/scenarios/validate`; предупреждения не показываются |

### 2.2 Экспорт сырых данных (US-D.2)

| Пункт | Статус | Где проверено |
|-------|--------|----------------|
| API экспорта ответов (JSON/CSV) | ✅ | `GET /projects/:projectId/responses/export?format=json|csv`, ExportResponsesUseCase |
| Кнопка экспорта в UI | ✅ | `ProjectProgressView.vue`: «Export JSON», «Export CSV» в блоке Responses |

### 2.3 Уведомления о запросах на удаление (US-C.3)

| Пункт | Статус | Где проверено |
|-------|--------|----------------|
| Модель/таблица deletion_requests | ✅ | Миграция `007_deletion_requests.sql`, модуль deletion-requests |
| API создания и списка запросов | ✅ | `POST /api/deletion-requests`, `GET /projects/:id/deletion-requests`, execute |
| Уведомление админу/PM при создании запроса | ✅ | DeletionRequestNotificationAdapter (инфра) |
| Список запросов и кнопка «Выполнить» в UI | ❌ | Нет страницы/секции Compliance, нет вызовов API deletion-requests на фронте |

### 2.4 Audit log

| Пункт | Статус | Где проверено |
|-------|--------|----------------|
| Таблица audit_log, запись критичных действий | ✅ | Миграция `008_audit_log.sql`, RecordAuditEntryUseCase, SupabaseAuditLogRepository |
| API чтения логов (опционально) | ⚠️ | Запись есть; отдельный GET-эндпоинт для логов не искался (по плану — опционально) |

---

## Фаза 3

### 3.1 One-click deletion (GDPR/DSAR)

| Пункт | Статус | Где проверено |
|-------|--------|----------------|
| Use case удаления/анонимизации PII, обновление deletion_request | ✅ | ExecuteDeletionRequestUseCase, InvitationPiiDeletionAdapter |
| Кнопка «Delete Respondent Data» в UI с подтверждением | ❌ | Нет UI для запросов на удаление (см. 2.3) |

### 3.2 Экспорт согласий для аудита (US-C.4)

| Пункт | Статус | Где проверено |
|-------|--------|----------------|
| API экспорта согласий | ✅ | `GET /projects/:projectId/consents/export?format=json|csv`, ExportConsentsUseCase |
| Кнопка «Export consents» в UI | ❌ | В api.config нет CONSENTS_EXPORT; на Progress/настройках проекта кнопки нет |

### 3.3 Панели респондентов (US-3.5)

| Пункт | Статус | Где проверено |
|-------|--------|----------------|
| Интеграция с панелью / UI «Купить аудиторию» | ❌ | Есть заготовка: route `/projects/:id/panel`, RespondentPanelStubView — по плану «хотя бы один канал» не реализован |

### 3.4 API для BI

| Пункт | Статус | Где проверено |
|-------|--------|----------------|
| Стабильный формат, аутентификация, документация | ⚠️ | Экспорт ответов/согласий даёт сырые данные; отдельного «API для BI» с ключом и схемой не найдено |

### 3.5 Auto-anonymization (опционально)

| Пункт | Статус | Где проверено |
|-------|--------|----------------|
| Фоновая задача по расписанию | ❌ | Не реализовано (по плану опционально) |

---

## Сводка

- **Фаза 1:** в основном ✅; Report UI не подключает метрики с бэкенда (mock).
- **Фаза 2:** экспорт ответов и API валидации сценария ✅; UI валидации сценария и UI запросов на удаление ❌.
- **Фаза 3:** бэкенд one-click deletion и экспорт согласий ✅; UI для запросов на удаление, кнопка экспорта согласий и панели респондентов ❌.

**Рекомендуемые следующие шаги**

1. **Report:** заменить mock в `ProjectReportView.vue` на вызов API отчёта/метрик (например, report presenter + backend report/metrics).
2. **Валидация сценария в мастере:** перед сохранением сценария или переходом к «Приглашения» вызывать `POST /api/scenarios/validate` и показывать предупреждения.
3. **UI запросов на удаление:** страница/вкладка (например, Progress или отдельная Compliance) со списком deletion-requests и кнопкой «Выполнить» с подтверждением.
4. **Экспорт согласий в UI:** добавить в api.config `CONSENTS_EXPORT`, на Progress или в настройках проекта кнопку «Export consents» (JSON/CSV).
