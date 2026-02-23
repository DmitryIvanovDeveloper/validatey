# Vercel: проекты validatey и validatey-backend

## Проекты (созданы и задеплоены)

| Проект               | Папка    | Production URL                    |
|----------------------|----------|------------------------------------|
| **validatey**        | frontend | https://validatey.vercel.app      |
| **validatey-backend**| backend  | https://validatey-backend.vercel.app |

## validatey (frontend)

- **Root Directory:** обязательно **`frontend`** (при деплое из Git без этого будет `vite: command not found`, т.к. сборка пойдёт из корня репо, где нет frontend-зависимостей).
- **Environment Variables** (Production / Preview / Development):
  - `VITE_API_BASE_URL` = `https://validatey-backend.vercel.app/api` (или ваш URL бэкенда)

## validatey-backend (backend)

- **Root Directory:** при деплое из папки `backend` по CLI не нужен. Либо при подключении репо: **Root Directory** = `backend`.
- **Environment Variables** (обязательно задать в Dashboard):
  - `SUPABASE_URL` = ваш Supabase URL
  - `SUPABASE_ANON_KEY` = ваш Supabase anon key
  - `FRONTEND_ORIGIN` = `https://validatey.vercel.app` (для CORS и cookie)
  - `COMMENT_FETCH_USE_JOBS` = `false` (для Vercel, где job система не работает; по умолчанию `true` для обратной совместимости)
  - Остальные по необходимости: `CEREBRAS_API_KEY`, `PORT`, `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET` и т.д. (см. backend/env.example)

## Домены

Домены уже привязаны при деплое: validatey.vercel.app и validatey-backend.vercel.app. При необходимости проверить/добавить: **Settings → Domains** в каждом проекте.

## Если в логах «vite: command not found»

Проверьте у проекта **validatey**: **Settings → General → Root Directory** = `frontend`. Без этого сборка запускается из корня репо, где нет `vite`.

## Деплой по CLI

```bash
# Frontend
cd frontend && vercel --prod --yes

# Backend
cd backend && vercel --prod --yes
```
