# insights-service

Internal service scaffold for Validatey insights domain:

- research
- comments
- scraper
- signals

## Current state

This service now handles insights endpoints natively.

- `GET /health` works
- `/internal/insights/*` is protected by `x-service-token`
- Vercel deployment is configured via `vercel.json` + `api/index.ts`

## Local run

```bash
cd insights-service
npm install
cp .env.example .env
npm run dev
```

Service starts on `http://localhost:8090`.

## Deploy (Vercel)

Use `insights-service` as Root Directory and set environment variables:

- `INTERNAL_SERVICE_TOKEN` (required)
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (required for native endpoints)
- `FRONTEND_ORIGIN` (optional, comma-separated)

The service entrypoint is `api/index.ts`.

## Internal routing

Internal routing is split by domain modules:

- `src/modules/research/interface-adapters/routes/research.internal.routes.ts`
- `src/modules/comments/interface-adapters/routes/comments.internal.routes.ts`
- `src/modules/scraper/interface-adapters/routes/scraper.internal.routes.ts`
- `src/modules/signals/interface-adapters/routes/early-signals.internal.routes.ts`

Also covered:

- `src/modules/comments/interface-adapters/routes/comments-flat.internal.routes.ts` for `/api/comments/:id`

## Integration note

Core API should proxy `/api/projects/:projectId/{research,comments,scraper,early-signals}` to this service.
