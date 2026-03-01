-- Add user stories fields to research_data table
-- Stores AI-generated user stories and generation timestamp

ALTER TABLE research_data
  ADD COLUMN IF NOT EXISTS user_stories JSONB NULL,
  ADD COLUMN IF NOT EXISTS user_stories_generated_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN research_data.user_stories IS 'AI-generated user stories based on project analysis';
COMMENT ON COLUMN research_data.user_stories_generated_at IS 'Timestamp when user stories were generated';

-- Create index for performance on user stories queries
CREATE INDEX IF NOT EXISTS idx_research_data_user_stories_generated_at
ON research_data(user_stories_generated_at)
WHERE user_stories_generated_at IS NOT NULL;