# Google Places Autocomplete — настройка

## Проблема

Search Suggestions (Google Places) показывает «No search suggestions yet», даже при наличии `GOOGLE_PLACES_API_KEY`.

## Причина (найдена)

API возвращает **403 PERMISSION_DENIED**:

> Places API (New) has not been used in project ... before or it is disabled.

API‑ключ есть, но **Places API (New)** не включён в Google Cloud.

## Решение

1. Открой: https://console.developers.google.com/apis/api/places.googleapis.com/overview?project=278140413819  
   (или выбери свой проект в Google Cloud Console)

2. Нажми **Enable** (Включить) для **Places API (New)**.

3. Подожди 1–2 минуты, пока изменения применятся.

4. Запусти сбор данных ещё раз: «Research market with AI».

## Проверка

```bash
cd backend
npx ts-node scripts/test-google-places-api.ts
```

При успехе: Status 200, в ответе есть `suggestions`.
