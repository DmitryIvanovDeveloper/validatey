# A/B Test: Google Places Autocomplete

**Дата:** 2026-02-06  
**Проект:** Research Canvas Test (`dcdb1e69-e6ac-4670-a368-d0e2af8bcc92`)  
**Одинаковые данные:** geography=Moscow Russia, segment=B2B SaaS founders, productDescription=Validation survey platform

## Результат

| Метрика | С Google Places | Без Google Places |
|---------|-----------------|-------------------|
| autocompleteDataCollected | ✅ true | ❌ false |
| Длина summary | 522 символов | 410 символов |
| Количество рекомендаций | 5 | 5 |
| Summary идентичен | — | **Нет** |
| Рекомендации идентичны | — | **Нет** |

## Выводы

**Ответы отличаются** при одинаковых входных данных (geography, segment, productDescription).

### Различия в Summary
- **С Places:** "Without autocomplete data, user insights, or early signals, it is challenging to determine the viability of the project."
- **Без Places:** "The lack of autocomplete data and user metrics makes it challenging to determine specific user needs."

Оба отчёта упоминают отсутствие autocomplete data — вероятно, в данном прогоне autocomplete не дал существенных insight'ов (или LLM интерпретировал данные как недостаточные).

### Различия в рекомендациях
- **С Places:** последняя рекомендация — "Refine the project scope and goals based on the findings..."
- **Без Places:** последняя рекомендация — **"Collect autocomplete data and search trends to inform product development"** — явно предлагает собрать autocomplete, т.к. этих данных нет.

Синтез различает наличие/отсутствие autocomplete и формирует разные рекомендации.

## Запуск теста

```bash
cd backend
npx ts-node scripts/ab-test-google-places.ts [projectId] [userId]
```

Файлы: `report-with-places.json`, `report-without-places.json`.
