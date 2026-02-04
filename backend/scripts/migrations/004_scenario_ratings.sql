-- Scenario quality ratings (1-5) for AI-generated scenarios
CREATE TABLE IF NOT EXISTS scenario_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  user_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scenario_ratings_project_id ON scenario_ratings(project_id);
CREATE INDEX IF NOT EXISTS idx_scenario_ratings_scenario_id ON scenario_ratings(scenario_id);
