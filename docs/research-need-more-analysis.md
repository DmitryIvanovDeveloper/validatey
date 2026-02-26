# Почему почти все допущения в статусе "Need more"

## Как устроена оценка допущений

1. **Synthesis LLM** даёт общий вердикт по проекту (validated / rejected / needs-more-data) и анализ комментариев.
2. **Assumption Assessment LLM** получает контекст (гипотеза, синтез, комментарии, **AUDIENCE COVERAGE**) и для каждого Key Assumption возвращает: `confirmed` | `need_more` | `not_supported`.

Статус "Need more" в UI — это результат **per-assumption** оценки, а не общего вердикта.

---

## Две основные причины "Need more"

### 1. Нет покрытия аудитории (AUDIENCE COVERAGE)

В промпте оценки допущений (STEP 3a) модель смотрит блок **Data sources → AUDIENCE COVERAGE**: таблицу "какие аудитории покрыты данными".

- **Правило:** если в таблице нет строки, где в метке `[audience: ...]` встречается **ACTOR** из допущения (например "entrepreneurs", "founders"), то сразу **status = need_more**, evidence: "AUDIENCE COVERAGE has no data for [ACTOR]".
- **Факт:** комментарии из **Reddit Search** и **Hacker News Search** сохраняются с `subsourceName = null` (в use case задаётся только для Reddit с явным subreddit). В `buildDataSourcesSummary` такой источник попадает в "(unknown source)" → аудитория **unknown**.
- В итоге в таблице есть только строка вида:  
  `– [audience: unknown]: N comments from (unknown source)`  
  Слов "entrepreneurs", "founders", "potential users" там нет → модель корректно решает: **нет данных по целевой аудитории** → need_more.

**Что не хватает:** чтобы поисковые комментарии считались данными по нужной аудитории, нужно:
- при сохранении комментариев из Reddit Search / HN Search задавать осмысленный `subsourceName` (например "Reddit Search", "Hacker News Search");
- в `classifySourceAudience()` добавить маппинг этих источников на аудиторию (например entrepreneurs), так как поиск идёт по сообществам про стартапы/SaaS/founders.

После этого в AUDIENCE COVERAGE появится, например:  
`✓ [audience: entrepreneurs / founders / ...]: N comments from Reddit Search, ...`  
и шаг 3a перестанет давать need_more только из-за "нет данных по аудитории".

---

### 2. Требуется именно поведенческое подтверждение (STEP 3b)

Даже при наличии покрытия аудитории модель проверяет **поведенческие доказательства**:

- **Правило:** "Direct evidence = people explicitly stating intent, describing actions, A/B results, beta feedback. NOT direct evidence = pain-point complaints, general frustrations, problem descriptions."
- В RULES явно: "Never infer behavior from pain: people complaining about a problem does NOT confirm they will use the proposed solution."

То есть:
- "Много жалоб на боль X" → подтверждает **боль**, но не то, что люди **будут пользоваться продуктом**.
- Для **confirmed** нужны формулировки в духе: "would pay for...", "looking for a tool like...", "tried X and switched", отзывы по бете и т.п.

В типичных комментариях с Reddit/HN чаще встречаются именно боли и фрустрации, а не явные заявления о намерении купить/использовать. Поэтому при текущей логике **need_more** здесь — ожидаемый и корректный вывод: "боль подтверждена, поведенческого подтверждения нет — нужны интервью/бета/A/B".

**Что не хватает для подтверждений:**
- **User insights из опросов:** ответы про WTP, намерение использовать, выбор "would buy" и т.д. — это как раз поведенческие сигналы.
- **Early signals:** бета-тесты, интервью, эксперименты — явные доказательства поведения.
- Без них комментарии с форумов чаще дают только "need more" или подтверждение боли, но не "confirmed" по действию.

---

## Что сделать, чтобы было больше подтверждений

| Что сделать | Эффект |
|-------------|--------|
| Заполнять `subsourceName` для Reddit Search и HN Search и маппить их в `classifySourceAudience` на целевую аудиторию (например entrepreneurs) | Убрать ложные "need_more" из-за "no data for [audience]"; шаг 3a будет проходить для типичных гипотез про founders/startups. |
| Добавлять в проект **user insights** (опросы с WTP, намерением, выбором продукта) | Дать модели прямые поведенческие доказательства → возможность ставить **confirmed** там, где допущение про "will use / will pay". |
| Добавлять **early signals** (бета, интервью, пилоты) | То же: явные доказательства поведения для шага 3b. |
| При желании — слегка смягчить бар в промпте (например явно разрешить "confirmed" при очень сильном validationScore + точном совпадении боли с допущением) | Больше "confirmed" только по комментариям, но выше риск ложных подтверждений; решение продуктовое. |

---

## Итог

- **Почти все "Need more"** получаются из-за:  
  (1) того, что поисковые комментарии не считаются данными по целевой аудитории (unknown), и  
  (2) того, что по правилам модели для "confirmed" нужны именно поведенческие доказательства, а не только боль.
- Чтобы получать **confirmed** без изменения строгости модели: исправить аудиторное покрытие для поиска (код) и подключать **user insights** и **early signals** (данные и продукт).
