# Чек-лист проверки после изменений по плану UX

Фронтенд: **http://localhost:5174** (или порт из вывода `npm run dev` в `frontend/`).  
Бэкенд должен быть запущен (например `npm run dev` в `backend/`).

---

## 1. Регистрация и вход

- [ ] Открыть http://localhost:5174 → редирект на `/login` (если не авторизован).
- [ ] Нажать «Don't have an account? Create one», ввести email и пароль, нажать «Create account».
- [ ] После регистрации должен быть редирект на `/projects`.

---

## 2. Онбординг (пустой список проектов)

- [ ] На странице Projects при пустом списке виден блок **«Let's validate your first hypothesis»** с полем и кнопкой «Create first project».
- [ ] Ввести гипотезу (одно предложение), нажать «Create first project» → переход на `/projects/new?onboarding=1`.
- [ ] Пройти визард до конца → редирект на `/projects/:id/invitations?onboarding=1` и подсказка «Share your link...».

---

## 3. Мастер создания проекта (3 шага)

- [ ] Projects → «+ New Project» → открывается визард.
- [ ] **Шаг 1 «Who & what?»:** секции «Who? (Segment)» и «What are we testing?», AI Helper, аккордеон «Add market context». Кнопки «Back» / «Next».
- [ ] **Шаг 2 «How?»:** выбор шаблона (Template), чекбокс «Edit questions manually», опция «Generate with AI [Beta]». Сценарий отображается после выбора шаблона. «Next».
- [ ] **Шаг 3 «Who to ask?»:** Project Name, Audience Size, Price; в «How will you find respondents?» **первый вариант — «Public link (I'll share in communities)»** (выбран по умолчанию), затем «I have a list of emails», затем «Buy audience [Soon]». «Complete».
- [ ] После Complete — переход на страницу приглашений проекта.

---

## 4. Дашборд проекта (табы)

- [ ] В списке проектов нажать на проект (или «View project») → открывается дашборд с табами: **Overview | Research | Report | Invitations**.
- [ ] Переключение табов ведёт на `/projects/:id`, `.../research`, `.../report`, `.../invitations`.
- [ ] На табе Overview: данные проекта, сегмент, гипотеза, сценарий, блок с метриками (response rate, sent/responded).

---

## 5. Research Assistant

- [ ] Таб **Research** → заголовок страницы **«Research Assistant»** (не «Research Canvas»).
- [ ] Блок «Based on your hypothesis», рекомендация шаблона, кнопка «Launch validation» (или аналог).

---

## 6. Отчёт (Executive Summary)

- [ ] Таб **Report** → при успешной загрузке отчёта сверху карточка **«Summary»** с:
  - Verdict (Go/No-go/Neutral + начало текста),
  - Key insight (WTP),
  - Recommendation (первая рекомендация).
- [ ] Кнопка **«Expand full report»** → ниже появляются полные блоки (Verdict, Metrics, WTP, Clusters, Alternatives, Recommendations).
- [ ] Кнопка меняется на **«Collapse full report»** и скрывает детальный блок.

---

## 7. Приглашения (два таба)

- [ ] Таб **Invitations** (или переход по «Manage Invitations») → под заголовком два таба: **«Public link»** и **«Personal invitations»**.
- [ ] Таб **Public link** активен по умолчанию: блок «Public link» (Enable public access, URL в формате `.../s/:slug`), блок «Share survey link».
- [ ] Таб **Personal invitations**: список приглашений, кнопка «Send invitations» в шапке открывает модалку (CSV, HubSpot и т.д.).

---

## 8. Короткая ссылка на опрос

- [ ] На странице приглашений включить «Enable public access», сохранить → в поле «Public survey URL» отображается ссылка вида `http://localhost:5174/s/XXXXXXXX` (короткий путь `/s/...`).
- [ ] Открыть эту ссылку в другой вкладке/режиме инкогнито → загрузка и редирект на опрос по токену, отображается первый вопрос опроса (или экран согласия).

---

## 9. Панель «Купить аудиторию»

- [ ] В визарде на шаге «Who to ask?» выбрать «Buy audience [Soon]», завершить создание → редирект на `/projects/:id/panel`.
- [ ] Страница «Respondent panel» с формой: Budget ($100 / $300 / $500), Segment (Product Managers / Developers / Small Business), кнопка «Go to order» → открывается внешняя ссылка (Respondent.io).

---

При прохождении всех пунктов изменения по плану считаются проверенными.
