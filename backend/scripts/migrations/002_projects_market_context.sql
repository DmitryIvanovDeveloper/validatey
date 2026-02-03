-- Add market context to projects (Variant B wizard steps)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS market_context JSONB;
