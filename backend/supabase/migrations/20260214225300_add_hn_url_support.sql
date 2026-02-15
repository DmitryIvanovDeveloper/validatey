-- Add Hacker News URL support to comment_sources table
ALTER TABLE comment_sources
ADD COLUMN IF NOT EXISTS hn_url TEXT,        -- Full HN post URL
ADD COLUMN IF NOT EXISTS hn_item_id TEXT;    -- HN item ID

-- Add index for HN item ID
CREATE INDEX IF NOT EXISTS idx_comment_sources_hn_item_id ON comment_sources(hn_item_id);

-- Update existing records to ensure hn_feed_type is properly set
-- (This handles the case where hn_feed_type might be null for existing records)