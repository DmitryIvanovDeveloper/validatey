-- Early signals table: stores LLM analysis of respondent comments
CREATE TABLE IF NOT EXISTS early_signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('positive', 'negative', 'neutral')),
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_early_signals_project_id ON early_signals(project_id);
