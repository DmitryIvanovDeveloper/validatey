# Vercel: проекты validatey и validatey-backend

## Проекты (созданы и задеплоены)

| Проект               | Папка    | Production URL                    |
|----------------------|----------|------------------------------------|
| **validatey**        | frontend | https://validatey.vercel.app      |
| **validatey-backend**| backend  | https://validatey-backend.vercel.app |

## validatey (frontend)

- **Root Directory:** оставить пустым (деплой из корня репозитория не подходит для монорепо) — проект привязан к папке `frontend` через деплой из неё по CLI.  
  Либо в Vercel: подключить репозиторий, **Root Directory** = `frontend`.
- **Environment Variables** (Production / Preview / Development):
  - `VITE_API_BASE_URL` = `https://validatey-backend.vercel.app/api` (или ваш URL бэкенда)

## validatey-backend (backend)

- **Root Directory:** при деплое из папки `backend` по CLI не нужен. Либо при подключении репо: **Root Directory** = `backend`.
- **Environment Variables** (обязательно задать в Dashboard):
  - `SUPABASE_URL` = ваш Supabase URL
  - `SUPABASE_ANON_KEY` = ваш Supabase anon key
  - `FRONTEND_ORIGIN` = `https://validatey.vercel.app` (для CORS и cookie)
  - Остальные по необходимости: `CEREBRAS_API_KEY`, `PORT` и т.д. (см. backend/env.example)

## Домены

Домены уже привязаны при деплое: validatey.vercel.app и validatey-backend.vercel.app. При необходимости проверить/добавить: **Settings → Domains** в каждом проекте.

## Деплой по CLI

```bash
# Frontend
cd frontend && vercel --prod --yes

# Backend
cd backend && vercel --prod --yes
```
