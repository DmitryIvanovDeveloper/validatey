-- Rounds: iterative validation rounds per project
CREATE TABLE IF NOT EXISTS rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_round_id UUID REFERENCES rounds(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'Round',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
  type TEXT NOT NULL DEFAULT 'survey' CHECK (type IN ('survey', 'interview', 'ab_test', 'field')),
  sort_order INT NOT NULL DEFAULT 0,
  results JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rounds_project_id ON rounds(project_id);
CREATE INDEX IF NOT EXISTS idx_rounds_parent_round_id ON rounds(parent_round_id);
CREATE INDEX IF NOT EXISTS idx_rounds_sort_order ON rounds(project_id, sort_order);

-- Link invitations to round (nullable for backward compatibility)
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS round_id UUID REFERENCES rounds(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_invitations_round_id ON invitations(round_id);

-- Link scenarios to round (nullable for backward compatibility)
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS round_id UUID REFERENCES rounds(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_scenarios_round_id ON scenarios(round_id);

-- Link reports to round (nullable for backward compatibility)
ALTER TABLE reports ADD COLUMN IF NOT EXISTS round_id UUID REFERENCES rounds(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_reports_round_id ON reports(round_id);
