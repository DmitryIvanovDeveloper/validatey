-- Add optional deadline to projects for validation timeline (Overview / Time Health)
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS deadline timestamptz NULL;

COMMENT ON COLUMN projects.deadline IS 'Optional target date for validation decision (Overview Time Health).';
