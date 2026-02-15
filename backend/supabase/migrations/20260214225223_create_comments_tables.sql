-- Comments module: comment sources, comments, and fetch jobs
CREATE TABLE IF NOT EXISTS comment_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('reddit', 'hackernews')),
  -- Reddit-specific fields
  reddit_url TEXT,  -- Full post URL or subreddit name
  subreddit_name TEXT,  -- Extracted subreddit name
  post_id TEXT,  -- Extracted post ID (if URL is a post)
  -- Hacker News-specific fields
  hn_feed_type TEXT,  -- top, new, ask, show, jobs, newcomments
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comment_sources_project_id ON comment_sources(project_id);
CREATE INDEX IF NOT EXISTS idx_comment_sources_source_type ON comment_sources(source_type);

-- comments: Fetched comments
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES comment_sources(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,  -- Reddit comment ID or HN item ID
  content TEXT NOT NULL,
  author TEXT,
  url TEXT NOT NULL,
  context_title TEXT,  -- Post title or HN story title
  context_url TEXT,  -- Post URL or HN story URL
  created_at TIMESTAMPTZ NOT NULL,  -- Comment creation time on source
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  import_origin TEXT DEFAULT 'api_fetch' CHECK (import_origin IN ('api_fetch', 'manual')),
  subsource_name TEXT,  -- Reddit subreddit name or HN feed type
  UNIQUE(source_id, external_id)  -- Prevent duplicate comments from same source
);

CREATE INDEX IF NOT EXISTS idx_comments_source_id ON comments(source_id);
CREATE INDEX IF NOT EXISTS idx_comments_project_id ON comments(project_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_is_processed ON comments(is_processed);
CREATE INDEX IF NOT EXISTS idx_comments_external_id ON comments(external_id);

-- fetch_jobs: Track async fetch operations
CREATE TABLE IF NOT EXISTS fetch_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES comment_sources(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  comments_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fetch_jobs_source_id ON fetch_jobs(source_id);
CREATE INDEX IF NOT EXISTS idx_fetch_jobs_project_id ON fetch_jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_fetch_jobs_status ON fetch_jobs(status);
CREATE INDEX IF NOT EXISTS idx_fetch_jobs_created_at ON fetch_jobs(created_at DESC);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_comment_sources_updated_at
  BEFORE UPDATE ON comment_sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fetch_jobs_updated_at
  BEFORE UPDATE ON fetch_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();