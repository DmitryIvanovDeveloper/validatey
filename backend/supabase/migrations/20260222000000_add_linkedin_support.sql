-- Add LinkedIn support to comment sources
ALTER TABLE comment_sources
  DROP CONSTRAINT IF EXISTS comment_sources_source_type_check;

ALTER TABLE comment_sources
  ADD CONSTRAINT comment_sources_source_type_check 
  CHECK (source_type IN ('reddit', 'hackernews', 'linkedin'));

-- Add LinkedIn-specific fields
ALTER TABLE comment_sources
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_post_id TEXT;

COMMENT ON COLUMN comment_sources.linkedin_url IS 'Full URL of the LinkedIn post';
COMMENT ON COLUMN comment_sources.linkedin_post_id IS 'Extracted ID of the LinkedIn post';
