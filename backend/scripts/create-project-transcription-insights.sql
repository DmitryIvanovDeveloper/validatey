-- Stores latest AI summary/insights per project transcription history.
create table if not exists public.project_transcription_insights (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null,
  summary text not null,
  insights jsonb not null default '[]'::jsonb,
  themes jsonb not null default '[]'::jsonb,
  risks jsonb not null default '[]'::jsonb,
  next_actions jsonb not null default '[]'::jsonb,
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id)
);

create index if not exists idx_project_transcription_insights_project_id
  on public.project_transcription_insights(project_id);
