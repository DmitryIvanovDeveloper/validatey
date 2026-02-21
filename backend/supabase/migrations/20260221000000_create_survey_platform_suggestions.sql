-- Survey Platform Suggestions: Store AI-generated platform suggestions and posts
CREATE TABLE IF NOT EXISTS survey_platform_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  platforms JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id) -- One suggestion set per project (latest)
);

CREATE INDEX IF NOT EXISTS idx_survey_platform_suggestions_project_id ON survey_platform_suggestions(project_id);
CREATE INDEX IF NOT EXISTS idx_survey_platform_suggestions_created_at ON survey_platform_suggestions(created_at DESC);

COMMENT ON TABLE survey_platform_suggestions IS 'AI-generated survey distribution platform suggestions with ready-to-post messages';
COMMENT ON COLUMN survey_platform_suggestions.platforms IS 'Array of platform suggestions: [{ "platform": string, "subplatform": string?, "reason": string, "postingStrategy": string, "expectedReach": string, "post": string }]';
