-- Store selected scenario template slug on project (for metrics and reports)
-- Run after 005_consents.sql

ALTER TABLE projects ADD COLUMN IF NOT EXISTS scenario_template_slug TEXT;
