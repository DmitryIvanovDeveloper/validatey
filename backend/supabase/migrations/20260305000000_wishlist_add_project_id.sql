-- Add project_id to wishlist for per-project waitlist (embed on landings)
-- Same email can join multiple projects; one row per (email, project_id). NULL project_id = global waitlist.

ALTER TABLE wishlist
  ADD COLUMN IF NOT EXISTS project_id UUID NULL REFERENCES projects(id) ON DELETE SET NULL;

ALTER TABLE wishlist DROP CONSTRAINT IF EXISTS wishlist_email_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_wishlist_email_project
  ON wishlist (LOWER(TRIM(email)), project_id);

CREATE INDEX IF NOT EXISTS idx_wishlist_project_id ON wishlist(project_id);

COMMENT ON COLUMN wishlist.project_id IS 'When set, this entry is for the project waitlist (e.g. from landing embed). NULL = global/main waitlist.';
