-- Feedback table for user feedback widget (feature request, bug, etc.)

CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('feature_request', 'bug_report', 'what_is_missing', 'other')),
  text TEXT NOT NULL,
  screenshot_url TEXT,
  user_id TEXT NOT NULL,
  page_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);
