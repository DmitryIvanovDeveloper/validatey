-- Deletion requests (GDPR/DSAR)
-- Run after 006_project_scenario_template_slug.sql

CREATE TABLE IF NOT EXISTS deletion_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  identifier TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')) DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  requested_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deletion_requests_project_id ON deletion_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_status ON deletion_requests(status);
