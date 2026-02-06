-- Research module: stored market/competitor data and synthesis report per project
CREATE TABLE IF NOT EXISTS research_data (
  project_id UUID PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  market_data JSONB,
  competitor_data JSONB,
  synthesis_report JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_research_data_project_id ON research_data(project_id);

COMMENT ON TABLE research_data IS 'Aggregated research data for Research Canvas: market, competitors, synthesis.';
