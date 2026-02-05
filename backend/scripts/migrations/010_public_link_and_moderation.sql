-- Public survey link settings and response moderation
-- Run after 009_consent_urls.sql

-- Projects: public link settings
ALTER TABLE projects ADD COLUMN IF NOT EXISTS public_access_enabled BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS public_slug TEXT UNIQUE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS max_public_responses INTEGER;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS require_public_email BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS captcha_enabled BOOLEAN DEFAULT false;
CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_public_slug ON projects(public_slug) WHERE public_slug IS NOT NULL;

-- Responses: moderation status for public-link responses
ALTER TABLE responses ADD COLUMN IF NOT EXISTS moderation_status TEXT CHECK (moderation_status IN ('pending', 'approved', 'rejected'));
CREATE INDEX IF NOT EXISTS idx_responses_moderation_status ON responses(moderation_status) WHERE moderation_status IS NOT NULL;

-- RPC to count responses from anonymous (public-link) invitations for a project
CREATE OR REPLACE FUNCTION count_public_responses_by_project(p_project_id UUID)
RETURNS BIGINT
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*)::BIGINT
  FROM responses r
  INNER JOIN invitations i ON r.invitation_id = i.id
  WHERE r.project_id = p_project_id
    AND i.email IS NULL
    AND i.phone IS NULL;
$$;
