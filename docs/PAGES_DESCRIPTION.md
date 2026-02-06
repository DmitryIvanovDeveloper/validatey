# Описание страниц приложения (кроме авторизации)

Что видит пользователь и что может сделать на каждой странице.

---

## Корневой маршрут `/` (Home)

- **Что видит:** Кратко — индикатор загрузки (спиннер).
- **Что происходит:** Редирект без отдельного экрана:
  - если пользователь авторизован → переход на **Список проектов** (`/projects`);
  - если нет → переход на **Вход** (`/login`).

---

## Список проектов — `/projects`

- **Заголовок:** «Projects», подзаголовок «Manage and validate your product hypotheses».
- **Что видит:**
  - Кнопка **«+ New Project»** (создание нового проекта).
  - Либо пустое состояние: «No projects yet» и кнопка **«Create project»**.
  - Либо сетка карточек проектов: название, статус (например DRAFT), дата, ссылка **«View project»**, кнопка **«Delete»**.
- **Что может сделать:**
  - Перейти к созданию проекта: **«+ New Project»** / **«Create project»** → визард создания (`/projects/new`).
  - Открыть проект: клик по карточке или **«View project»** → детали проекта (`/projects/:id`).
  - Удалить проект: **«Delete»** → модальное окно подтверждения → **«Delete project»**.

---

## Создание проекта (визард) — `/projects/new`

Пошаговый визард из 4 шагов.

- **Заголовок:** «Create New Project», подзаголовок «Define segment, hypothesis, scenario, and audience».
- **Шаги (что видит и что может сделать):**

### Шаг 1: Who? (Segment)
- Поля: **Segment Description***, **Demographics*** (с примерами в placeholder).
- Действия: **«Next»** (обязательно заполнить сегмент и демографию).

### Шаг 2: What are we testing?
- Поля: **Hypothesis Description**, **Assumptions** (список с кнопками «+ Add Assumption» и удалением).
- Кнопка **«AI Helper for Formulation»** — модальное окно с подсказкой по формулировке гипотезы (при наличии сегмента можно получить предложение).
- Раскрывающийся блок **«Add market context (AI-assisted)»**: поля Market Picture, Market Fit, Differentiation; кнопка **«Suggest with AI»** (доступна при заполненном сегменте).
- Действия: **«Back»**, **«Next»**.

### Шаг 3: How will we ask?
- Выбор способа: **Choose template** / **Generate with AI [Beta]** / **Edit manually**.
- При выборе шаблона — выпадающий список **Template** (например Problem Validation (WTP), Feature Validation, Value Proposition Test); после выбора показывается блок **Survey Scenario** с вопросами и кнопкой **«Show JSON»**.
- Действия: **«Back»**, **«Next»**.

### Шаг 4: Who will we ask?
- Поля: **Project Name***, **Audience Size*** (число, подсказка 100–200), **Price per Response*** (подсказка $5–10).
- Выбор способа привлечения респондентов: **«I have a list of emails»** (подсказка про CSV/HubSpot на странице Invitations), **«Public link (I'll share in communities)»**, **«Buy audience [Soon]»**.
- Отображается **Project Cost** (размер × цена).
- Действия: **«Back»**, **«Complete»**.

- **После «Complete»:** сохранение проекта и сценария; редирект:
  - при выборе «I have a list of emails» или «Public link» → **Invitations** (`/projects/:id/invitations`);
  - при выборе «Buy audience» → **Panel** (`/projects/:id/panel`);
  - иначе → **Список проектов** (`/projects`).

---

## Детали проекта — `/projects/:projectId`

- **Хлебные крошки:** Projects / название проекта.
- **Заголовок:** название проекта. Кнопки: **Manage Invitations**, **Progress**, **Research**, **Report**.
- **Что видит (карточки):**
  - **Проект:** статус, даты создания и обновления.
  - **Segment:** описание сегмента (кнопка AI-Format для форматирования текста).
  - **Demographics:** демография (кнопка AI-Format).
  - **Market context (optional):** только если данные есть — подсекции Market Picture, Market Fit, Differentiation (у каждой кнопка AI-Format).
  - **Hypothesis:** описание и при наличии — список допущений (кнопки AI-Format).
  - **Scenario:** сценарий опроса (или сообщение об отсутствии).
  - **Audience:** краткое описание и ссылка на управление приглашениями.
- **Что может сделать:**
  - Перейти в **Invitations**, **Progress**, **Research**, **Report** по кнопкам в шапке.
  - Нажимать **AI-Format** у блоков с текстом для AI-форматирования.

---

## Прогресс проекта — `/projects/:projectId/progress`

- **Подзаголовок:** «Response metrics and early signals».
- **Кнопки в шапке:** Manage Invitations, View Report, «← Back».
- **Что видит:**
  - **Hero-блок:** круг прогресса с процентом ответивших (response rate), число «X of Y sent responded», подсказка (отправить приглашения / собрать больше ответов / можно генерировать отчёт).
  - **Колонка операций:** метрики Total / Sent / Responded; блок **Invitations** — список приглашений с email и статусом.
  - **Колонка инсайтов:** **Early Signals** (positive / negative / neutral) — карточки с заголовком и описанием; **Responses** — список ответов, кнопки **Export JSON** / **Export CSV**.
- **Что может сделать:**
  - Перейти в Invitations, Report или назад в проект.
  - Экспортировать ответы в JSON или CSV.

---

## Отчёт по проекту — `/projects/:projectId/report`

- **Заголовок:** «Project Report», подзаголовок «Validation results and recommendations».
- **Кнопки:** Download HTML, Download PDF, Share, «← Back».
- **Что видит (при успешной генерации):**
  - **Verdict** — вердикт с иконкой и текстом.
  - **Key Metrics** — сетка метрик.
  - **Willingness to Pay (WTP)** — средняя готовность платить.
  - **Respondent Clusters** — кластеры респондентов с размерами и статистикой.
  - **Alternative Solutions** — список альтернатив.
  - **Recommendations** — нумерованные рекомендации.
  - Кнопка **«Create New Round/Hypothesis»**.
- **Состояния:**
  - Загрузка: «Generating report...».
  - «Not enough responses yet» — пустое состояние с кнопками «Try again» и «Back to project».
  - Ошибка — сообщение и кнопка «Retry».
- **Что может сделать:**
  - Скачать отчёт в HTML или PDF, поделиться (Share).
  - Вернуться к проекту, повторить генерацию, перейти к новому раунду/гипотезе.

---

## Research Assistant — `/projects/:projectId/research`

- **Заголовок:** «Research Assistant», подзаголовок — название проекта.
- **Кнопки в шапке:** Back, **Collect data**, **Generate synthesis**.
- **Что видит:**
  - Блок **«Based on your hypothesis»**: текст «Use the tools below to deepen your research, or go straight to validation»; при наличии — рекомендация шаблона (например «For this hypothesis we recommend the **Problem Validation (WTP)** template»); кнопка **«Launch validation with these settings»** (переход на Invitations).
  - Опциональный сбор: подпись «Help me research the market (optional)», поля **Geography** и **Segment**.
  - При ошибках — сообщения об ошибках Collect/Synthesis.
  - При наличии — блок **Synthesis report** (summary и список recommendations).
  - **AI Research Assistant** — чат: история сообщений (You / Assistant), поле ввода, кнопка отправки; в ответах ассистента могут быть списки suggested methods и clarification questions.
  - Сетка из трёх блоков: **Market Data** (size, growth, trends или «No market data yet»), **Competitors** (конкуренты, цены, рейтинг или «No competitor data yet»), **User Insights** (боли, WTP, retention или «No user insights yet»).
- **Что может сделать:**
  - Вернуться в проект (Back), запустить сбор данных (**Collect data**), сгенерировать синтез (**Generate synthesis**).
  - Перейти к приглашениям и опросу (**Launch validation with these settings**).
  - Задавать вопросы в чате (анализ, методы, уточнения); просматривать ответы и списки в ответах ассистента.
  - Просматривать заполненные блоки Market Data, Competitors, User Insights после сбора и появления инсайтов.

---

## Приглашения — `/projects/:projectId/invitations`

- **Заголовок:** «Invitations», подзаголовок «Send and track survey invitations by email or share a single link».
- **Кнопки:** «← Back», **«Send invitations»** (открывает модальное окно).
- **Что видит:**

### Public link
- Чекбокс **«Enable public access»**.
- При включении: поле **Public survey URL** (read-only) и кнопка **Copy**; **Max responses**; чекбоксы «Require email for public respondents», «Enable CAPTCHA»; кнопка **Save settings**.

### Share survey link
- Кнопка **«Generate new link»**; после генерации — поле с ссылкой, **Copy**, **«Generate another link»**.

### Invitations list
- Количество приглашений, при наличии pending — бейдж и кнопка **«Send pending»**.
- Таблица/список приглашений (email, статус и т.д.).
- В модальном окне «Send invitations»: импорт **CSV** (выбор файла, превью по колонке email, «Add X invitations»), блок **«Connect HubSpot [Coming soon]»** (заглушка).

- **Что может сделать:**
  - Включить публичную ссылку, скопировать URL, задать лимит ответов и опции, сохранить настройки.
  - Сгенерировать и копировать персональную ссылку для респондента.
  - Загрузить CSV, добавить приглашения, отправить ожидающие приглашения.

---

## Панель респондентов (заглушка) — `/projects/:projectId/panel`

- **Заголовок:** «Respondent panel», подзаголовок «Buy audience for your survey».
- **Что видит:** Карточка «Buy audience» с текстом о будущем заказе респондентов по региону, сегменту, бюджету и интеграции с панелями (coming soon). Ссылка на страницу **Invitations** для рассылки или загрузки списка email.
- **Что может сделать:** Перейти по ссылке на Invitations.

---

## Публичная ссылка на опрос — `/survey/public/:slug`

- **Что видит:** Сообщение «Loading survey...» или текст ошибки (если ссылка недействительна или запрос не удался).
- **Что происходит:** Страница по slug запрашивает у API данные приглашения; при успехе выполняется редирект на **Опрос респондента** по токену (`/survey/:token`). Отдельного контента для пользователя нет — только загрузка или ошибка.

---

## Опрос респондента — `/survey/:token`

- **Контекст:** Респондент переходит по персональной или публичной ссылке (после редиректа с `/survey/public/:slug`).
- **Что видит:**
  - При загрузке: «Loading survey...».
  - При ошибке: «Loading Error», сообщение, кнопка **Try Again**.
  - При включённом согласии и до его принятия: экран **Consent and data use** (текст согласия, использование данных, ссылки на Privacy Policy / Terms of Service при наличии), чекбокс «I have read and agree to the above», кнопка **Continue**.
  - После согласия (или если оно не требуется): прогресс «Question X of Y» и полоса прогресса; вопросы по одному — в зависимости от типа (scale 1–5, открытый текст, multiple choice и т.д.); кнопки **Next** / **Back** / **Submit** в конце.
  - После отправки: экран благодарности (survey completed).
- **Что может сделать:**
  - Принять согласие и продолжить, ответить на вопросы, отправить ответ.

---

## 404 — `/:pathMatch(.*)*`

- **Что видит:** Заголовок «404», текст «Page not found», ссылка **«Return to Home»** (переход на `/`).
- **Что может сделать:** Вернуться на главную (далее редирект на `/projects` или `/login` в зависимости от авторизации).
