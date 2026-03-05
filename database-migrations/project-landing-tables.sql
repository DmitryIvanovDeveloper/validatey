-- Migration: Create project landings tables
-- Created: 2026-03-05
-- Description: Tables for hosting project landing pages on subdomains

-- Create project_landings table
CREATE TABLE IF NOT EXISTS project_landings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  slug VARCHAR(50) NOT NULL UNIQUE,
  archive_filename VARCHAR(255) NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  file_count INTEGER NOT NULL CHECK (file_count > 0),
  total_size_bytes BIGINT NOT NULL CHECK (total_size_bytes >= 0),

  -- Indexes
  CONSTRAINT project_landings_project_id_key UNIQUE (project_id),
  CONSTRAINT project_landings_slug_check CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

-- Create landing_files table
CREATE TABLE IF NOT EXISTS landing_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_id UUID NOT NULL REFERENCES project_landings(id) ON DELETE CASCADE,
  filename VARCHAR(500) NOT NULL,
  content_type VARCHAR(100) NOT NULL,
  size_bytes BIGINT NOT NULL CHECK (size_bytes >= 0),
  storage_path VARCHAR(1000) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Indexes
  INDEX idx_landing_files_landing_id (landing_id),
  INDEX idx_landing_files_filename (filename),
  CONSTRAINT landing_files_landing_filename_unique UNIQUE (landing_id, filename)
);

-- Add RLS policies for project_landings
ALTER TABLE project_landings ENABLE ROW LEVEL SECURITY;

-- Users can only see landings for projects they own
CREATE POLICY "Users can view their own project landings"
  ON project_landings
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Users can only create landings for projects they own
CREATE POLICY "Users can create landings for their own projects"
  ON project_landings
  FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Users can only update landings for projects they own
CREATE POLICY "Users can update their own project landings"
  ON project_landings
  FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Users can only delete landings for projects they own
CREATE POLICY "Users can delete their own project landings"
  ON project_landings
  FOR DELETE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Add RLS policies for landing_files
ALTER TABLE landing_files ENABLE ROW LEVEL SECURITY;

-- Users can only see files for landings of projects they own
CREATE POLICY "Users can view files for their own project landings"
  ON landing_files
  FOR SELECT
  USING (
    landing_id IN (
      SELECT pl.id FROM project_landings pl
      JOIN projects p ON pl.project_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- Users can only create files for landings of projects they own
CREATE POLICY "Users can create files for their own project landings"
  ON landing_files
  FOR INSERT
  WITH CHECK (
    landing_id IN (
      SELECT pl.id FROM project_landings pl
      JOIN projects p ON pl.project_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- Users can only delete files for landings of projects they own
CREATE POLICY "Users can delete files for their own project landings"
  ON landing_files
  FOR DELETE
  USING (
    landing_id IN (
      SELECT pl.id FROM project_landings pl
      JOIN projects p ON pl.project_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- Create storage bucket for landing files (if using Supabase Storage)
-- This would need to be run separately in Supabase dashboard or via API
-- INSERT INTO storage.buckets (id, name, public) VALUES ('landings', 'landings', true);

-- Add comments for documentation
COMMENT ON TABLE project_landings IS 'Stores metadata for uploaded project landing pages';
COMMENT ON TABLE landing_files IS 'Stores individual files that make up a landing page';
COMMENT ON COLUMN project_landings.slug IS 'URL-friendly identifier used as subdomain (e.g., myproject)';
COMMENT ON COLUMN project_landings.archive_filename IS 'Original filename of the uploaded ZIP archive';
COMMENT ON COLUMN landing_files.storage_path IS 'Path to file in storage system';