-- Consent URLs for survey (Privacy Policy, Terms of Service)
-- Run after 008_audit_log.sql

ALTER TABLE projects ADD COLUMN IF NOT EXISTS privacy_policy_url TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS terms_of_service_url TEXT;
