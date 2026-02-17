-- Add last_research_run_at column to research_data table for cooldown functionality
ALTER TABLE research_data
ADD COLUMN last_research_run_at TIMESTAMP WITH TIME ZONE;

-- Add comment explaining the purpose
COMMENT ON COLUMN research_data.last_research_run_at IS 'Timestamp of the last research data collection run, used for enforcing 24-hour cooldown period';