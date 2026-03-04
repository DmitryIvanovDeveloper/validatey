# Полный research: до и после

## Что запускалось

1. **ДО** — сохранён canvas в `full_before.json`.
2. **Collect** — `POST /research/collect` выполнен успешно (200).
3. **Synthesis** — `POST /research/synthesis` вернул 400: `"Synthesis batch mode: no pattern analysis from any batch"` (LLM не вернул commentPatternAnalysis ни в одном батче; при 301 комментарии используется batch mode по 60 комментариев).
4. **ПОСЛЕ** — сохранён canvas в `full_after.json` (после collect, отчёт синтеза не обновлялся).

Для проверки синтеза временно включён кулдаун по env: `RESEARCH_COOLDOWN_MINUTES=0` (без перезапуска бэкенда с этой переменной снова будет 24 ч).

---

## Сравнение ДО / ПОСЛЕ

| Объект | ДО | ПОСЛЕ |
|--------|-----|--------|
| **researchStatusUpdatedAt** | 2026-03-02T17:58:06.029Z | 2026-03-02T18:02:48.434Z |
| **autocompleteInsights.searchPhrases** | 12 фраз (feedback for indie hackers, honest startup feedback, …) | 12 других фраз (honest feedback for startups, give to get feedback model, …) |
| **autocompleteInsights.results** | 4 группы (startup advice, feedback for PM, advice for indie, startup feedback loop) | 2 группы (give to get feedback model, product managers need feedback loop) |
| **synthesisReport** | без изменений | без изменений (synthesis не перезапускался) |
| **commentPatternAnalysis** | 2 паттерна, classifiedComments: 13, validationScore: 4 | то же самое |

Итог: **collect** обновил дату последнего запуска и autocomplete; **synthesis** не выполнялся, отчёт и паттерны остались прежними.

---

## Как теперь выглядит в UI (после правок кода)

При тех же данных в canvas интерфейс покажет:

- Шапка: **«13 / 301 unique comments in patterns»** (вместо «comments classified») и тултип с пояснением про пересечение паттернов.
- Supporting Evidence: **«12 comments (10 authors)»** и **8%** (count из `commentIds.length`, не 23).
- Contradictions: **«1 comment (1 author)»** и **5%** (не 15).
- Нет артефакта «15 / 50 / 100» за счёт приведения count/percentage к числу.

---

## Рекомендация по synthesis в batch mode

Чтобы в следующий раз получить «после» с новым синтезом:

- Дождаться успешного ответа от LLM с `commentPatternAnalysis` в batch mode **или**
- Временно увеличить `SYNTHESIS_BATCH_SIZE` (например до 350), чтобы для 301 комментария использовался single-pass и один вызов LLM, либо добавить fallback: при `batchAnalyses.length === 0` повторить один раз в single-pass режиме.

Файлы: `full_before.json`, `full_after.json`.
