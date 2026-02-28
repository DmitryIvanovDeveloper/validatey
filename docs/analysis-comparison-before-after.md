# Сравнение анализа комментариев: до и после запуска синтеза

Проект: **Founder Validation Pain Survey** (`ec73391f-6d45-40dc-b80b-6809cfd0cc1d`).  
Запуск синтеза: 2026-02-28 (~80 с).

---

## Сводка

| Метрика | До | После | Изменение |
|--------|----|-------|-----------|
| **Validation Score** | 75% | **82%** | +7% |
| **Total comments** | 478 | 478 | без изменений |
| **Recurrence Score** | 1 (100%) | 1 (100%) | без изменений |
| **Число сабреддитов** | 6 | 6 | без изменений |
| **analyzedAt** | 2026-02-28T08:02:39Z | 2026-02-28T08:07:53Z | обновлено |

---

## Распределение по сабреддитам (без изменений)

Одинаково до и после:

- r/Entrepreneur: 128
- r/micro_saas: 65
- r/startups: 41
- r/buildinpublic: 29
- r/SideProject: 5
- r/indiebiz: 4

---

## Паттерны: до

| Паттерн | Count | Subreddits |
|---------|-------|------------|
| Users face challenges with product validation | 14 | 3 (r/micro_saas, r/Entrepreneur, r/buildinpublic) |
| Users seek honest feedback | 6 | 3 |
| Myths and misconceptions | 4 | 2 |
| Myths about building a product | — | 1 |

---

## Паттерны: после

| Паттерн | Count | Subreddits |
|---------|-------|------------|
| Validation signal: founders need help with idea validation | 7 | 3 (r/micro_saas, r/Entrepreneur, r/buildinpublic) |
| Founders seeking validation and advice | 5 | 2 (r/micro_saas, r/buildinpublic) |
| The 'build it and they'll come' mentality is a myth | 5 | 2 (r/micro_saas, r/Entrepreneur) |
| Execution is the hardest part | 2 | 1 (r/Entrepreneur) |
| Myth: 'Build it and they'll come' | 2 | 1 (r/buildinpublic) |

LLM переформулировал и разбил паттерны, поэтому изменились названия и распределение по count/subreddits. Обогащение (subredditCount, subredditNames, recurrenceScore, subredditDistribution) применяется к новому результату синтеза и сохраняется.

---

## Проверка UI после анализа

В блоке **Comment Pattern Analysis** на Overview отображаются:

- **Strong Evidence (82%)** — обновлённый validation score.
- **Recurrence: 100%** — подсказка: «Same patterns appear across subreddits — strong validation signal».
- **6 subreddits** — подсказка: «Comments from these communities».
- У каждого паттерна: **in N subreddits** и при наведении список сабреддитов (например r/micro_saas, r/Entrepreneur, r/buildinpublic).

Все новые поля (recurrence, число сабреддитов, subredditCount/subredditNames по паттернам) отображаются в UI.
