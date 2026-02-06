# Нарушения Clean Architecture (Uncle Bob)

Краткий отчёт о нарушениях правила зависимостей и границ слоёв в проекте Validatey.

---

## 1. Application layer зависит от Infrastructure (Backend)

**Правило:** Внутренние слои (Domain, Application) не должны зависеть от внешних (Infrastructure, Frameworks).

**Факт:** Use cases и порты в `application/` импортируют из `infrastructure/`:

- **Result:** Порты и use cases импортируют `ResultEx` из `infrastructure/result/result.ts`. Тип результата — часть контракта приложения; он не должен жить в infrastructure.
- **LoggerPort:** Use cases импортируют `LoggerPort` из `infrastructure/logging/ports/logger.port.ts`. В Clean Architecture порты, используемые use cases, должны быть объявлены в application (например `application/ports/logger.port.ts`), а реализация — в infrastructure.
- **TYPES (DI-токены):** Use cases импортируют `TYPES` из `*/infrastructure/bootstrap/types.ts` (и из других модулей). Композиция зависимостей должна выполняться в composition root; use case не должен знать про токены инфраструктуры. Конструктор use case должен принимать только интерфейсы; кто и какой токен передаёт — решает только bootstrap/container.

**Примеры файлов:**

- `backend/src/modules/*/application/use-cases/*.ts` — импорты `ResultEx`, `LoggerPort`, `TYPES` из infrastructure и других модулей.
- `backend/src/modules/*/application/ports/*.port.ts` — импорт `ResultEx` из `../../../../infrastructure/result/result`.

**Рекомендация:**

- Вынести `Result` (или общий тип результата) в shared kernel или в слой application (например `application/common/result.ts`), чтобы и domain, и application могли на него опираться без зависимости от infrastructure.
- Объявить порты, используемые use cases (Logger, репозитории и т.д.), в application/ports; в infrastructure — только реализации и регистрация в container по этим портам.
- Резолвить use cases в composition root (bootstrap), не импортировать TYPES внутри use case-файлов; use case зависит только от интерфейсов, переданных в конструктор.

---

## 2. Domain зависит от платформы (Backend)

**Правило:** Domain не должен зависеть от фреймворков, БД, HTTP, платформы (Node.js, браузер).

**Факт:** Сущность проекта использует Node.js API:

```ts
// backend/src/modules/projects/domain/entities/project.entity.ts
import { randomUUID } from 'crypto';
```

**Проблема:** Domain-сущность завязана на Node.js. Это нарушает независимость domain и усложняет тесты и перенос кода.

**Рекомендация:** Генерацию id вынести за пределы domain: передавать `id` в фабричный метод/конструктор извне или использовать порт `IdGenerator` (определён в application), реализация которого в infrastructure вызывает `crypto.randomUUID()`.

---

## 3. View вызывает Repository и HttpClient напрямую (Frontend)

**Правило:** UI (Views) должен общаться только с Presenter (или с Use Case через Presenter). Не с репозиториями, не с HTTP-клиентом.

**Факт:**

- **ProjectReportView.vue:** Получает `ReportRepositoryPort` из container и вызывает `reportRepository.get(projectId)` в `generateReport()`. Загрузка отчёта должна идти через Presenter → Use Case → Repository.
- **ProjectProgressView.vue:** Использует `projectRepository`, `invitationRepository`, `httpClient` для загрузки приглашений, ответов, early signals, экспорта, модерации, deletion requests. Вся эта логика должна быть в Presenter (+ use cases на бэкенде и вызовы API через презентер на фронте), а не в View.
- **ProjectDetailsView.vue:** Вызывает `scenarioRepository.getLatestByProjectId(projectId)` и `httpClient.post(API_CONFIG.ENDPOINTS.AI_FORMAT_TEXT, ...)`. Загрузка сценария и форматирование текста должны идти через презентер (и при необходимости отдельные use cases/сервисы на бэкенде).

**Следствие:** View знает о репозиториях, HTTP и структуре API; при смене способа получения данных придётся менять View. Слой представления перегружен логикой доступа к данным.

**Рекомендация:**

- Ввести (или расширить) Presenter для Progress и Report: например `ProgressPresenter`, `ReportPresenter`, которые вызывают API (через один общий HttpClient/репозиторий, зарегистрированный в infrastructure) и обновляют ViewModel. View только вызывает методы презентера и биндится к ViewModel.
- В ProjectDetailsView: загрузка сценария и вызов AI format — через ProjectPresenter (или ScenarioPresenter + AI presenter), без прямого доступа к `scenarioRepository` и `httpClient` из View.

---

## 4. View зависит от Container (Frontend)

**Правило:** Composition root (контейнер DI) должен быть на границе приложения. View не должен знать, как резолвятся зависимости.

**Факт:** Во многих Vue-компонентах выполняется прямой резолв зависимостей:

```ts
const presenter = container.get<ProjectPresenter>(TYPES.ProjectPresenter);
const reportRepository = container.get<ReportRepositoryPort>(TYPES.ReportRepository);
```

**Проблема:** View завязан на конкретный контейнер и токены; усложняется тестирование (нужно мокать container) и замена реализации.

**Рекомендация:** Резолвить презентеры (и при необходимости другие зависимости для экрана) в composition root (например в `main.ts` или роутере) и передавать их во View через `provide/inject` или пропсы. View получает только интерфейс презентера и не импортирует container/TYPES.

---

## 5. Cross-module dependency через Infrastructure (Backend)

**Правило:** Модули не должны зависеть от деталей других модулей (например от их infrastructure).

**Факт:** Use cases одного модуля импортируют `TYPES` (и иногда порты) из infrastructure других модулей, например:

- `research/application/use-cases/*.ts` — импорт `TYPES as PROJECT_TYPES`, `SIGNALS_TYPES`, `METRICS_TYPES` из соответствующих `*/infrastructure/bootstrap/types`.
- `invitations/application/use-cases/create-anonymous-invitation-for-public-link.use-case.ts` — импорт `PROJECT_TYPES`, `RESPONSE_TYPES` из infrastructure других модулей.

**Проблема:** Application layer модуля A зависит от infrastructure модуля B. При изменении способа регистрации зависимостей в B (например переименование TYPES) ломается A. Зависимость между модулями должна идти через контракты (порты в application), а не через конфигурацию инфраструктуры.

**Рекомендация:** Use case принимает в конструкторе только интерфейсы (порты) других модулей. Регистрация конкретных реализаций и привязка к TYPES выполняются в общем composition root; use case не импортирует TYPES из других модулей.

---

## 6. Итоговая таблица

| Нарушение | Слой | Критичность | Где исправлять |
|-----------|------|-------------|----------------|
| Application импортирует Result, LoggerPort, TYPES из Infrastructure | Backend application | Высокая | Вынести Result/порты в application или kernel; убрать импорт TYPES из use cases |
| Domain использует `crypto.randomUUID` | Backend domain | Средняя | Генерация id снаружи domain или порт IdGenerator |
| View вызывает Repository/HttpClient | Frontend views | Высокая | Progress, Report, Details: логику перенести в Presenter |
| View резолвит зависимости через Container | Frontend views | Средняя | provide/inject из composition root |
| Use case зависит от infrastructure другого модуля (TYPES) | Backend application | Средняя | Зависимости только через порты; составление в bootstrap |

---

## Что сделано правильно

- **Backend:** Use cases содержат бизнес-логику и вызывают только порты (репозитории, LLM и т.д.); презентеры тонкие и делегируют use cases; маршруты только маппят HTTP на вызовы презентера. Domain-сущности в целом чистые (кроме `crypto` в project.entity).
- **Frontend:** Многие экраны уже идут через Presenter (ProjectsListView, CreateProjectWizardView, SurveyView, LoginView и т.д.); нарушение сосредоточено в Progress, Report и частично Details.
- **Порты репозиториев** в backend объявлены в application и возвращают domain-типы и Result — направление зависимостей в целом верное, нарушает только место определения Result и зависимость application от infrastructure (TYPES, Logger, Result).

Исправление перечисленных пунктов приблизит проект к правилу зависимостей Clean Architecture и упростит тестирование и замену реализаций.
