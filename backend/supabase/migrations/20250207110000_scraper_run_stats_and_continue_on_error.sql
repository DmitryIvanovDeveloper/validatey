-- RunStats and continueOnError (Stage 1 observability & reliability)

-- scraper_runs: add run_stats, allow status 'partially_failed'
ALTER TABLE scraper_runs
  ADD COLUMN IF NOT EXISTS run_stats JSONB;

ALTER TABLE scraper_runs
  DROP CONSTRAINT IF EXISTS scraper_runs_status_check;

ALTER TABLE scraper_runs
  ADD CONSTRAINT scraper_runs_status_check
  CHECK (status IN ('pending', 'running', 'completed', 'failed', 'partially_failed'));

-- scraper_sources: stop on first error (default true = current behavior)
ALTER TABLE scraper_sources
  ADD COLUMN IF NOT EXISTS stop_on_first_error BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN scraper_runs.run_stats IS 'Quality metrics: urlsTotal, urlsSuccess, urlsWithItems, totalItems, avgItemsPerUrl';
COMMENT ON COLUMN scraper_sources.stop_on_first_error IS 'If false, run continues on parse error and run status may be partially_failed';
