-- Scraper module: configurable data sources and run results
CREATE TABLE IF NOT EXISTS scraper_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('competitor_sites', 'user_reviews', 'job_market', 'news_articles', 'custom')),
  name TEXT,
  urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  what_to_collect JSONB NOT NULL DEFAULT '[]'::jsonb,
  frequency TEXT NOT NULL DEFAULT 'once' CHECK (frequency IN ('once', 'daily', 'weekly')),
  ai_processing TEXT NOT NULL DEFAULT 'none' CHECK (ai_processing IN ('analyze_trends', 'compare_with_us', 'none')),
  custom_selectors JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scraper_sources_project_id ON scraper_sources(project_id);

CREATE TABLE IF NOT EXISTS scraper_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scraper_source_id UUID NOT NULL REFERENCES scraper_sources(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  raw_result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scraper_runs_scraper_source_id ON scraper_runs(scraper_source_id);
CREATE INDEX IF NOT EXISTS idx_scraper_runs_project_id ON scraper_runs(project_id);
CREATE INDEX IF NOT EXISTS idx_scraper_runs_created_at ON scraper_runs(created_at DESC);
