-- Add research_status and research_status_updated_at for "in progress" state across reloads
ALTER TABLE research_data
  ADD COLUMN IF NOT EXISTS research_status TEXT DEFAULT 'idle',
  ADD COLUMN IF NOT EXISTS research_status_updated_at TIMESTAMPTZ;

COMMENT ON COLUMN research_data.research_status IS 'Current phase: idle | collecting | synthesizing';
COMMENT ON COLUMN research_data.research_status_updated_at IS 'When status was last updated (for staleness check)';
