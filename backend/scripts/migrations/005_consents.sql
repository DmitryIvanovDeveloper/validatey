-- Consents and project consent text (GDPR/compliance)
-- Run in Supabase SQL Editor after 004_scenario_ratings.sql

-- Add consent text fields to projects (optional; used when consent is required for survey)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS consent_text TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS consent_data_usage_text TEXT;

-- Consent records: one row per invitation that accepted consent
CREATE TABLE IF NOT EXISTS consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  invitation_id UUID NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  consent_text_id TEXT,
  consent_text TEXT,
  accepted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(invitation_id)
);

CREATE INDEX IF NOT EXISTS idx_consents_project_id ON consents(project_id);
CREATE INDEX IF NOT EXISTS idx_consents_invitation_id ON consents(invitation_id);
