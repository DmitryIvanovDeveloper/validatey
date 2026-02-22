-- Add comment_pattern_analysis column to research_data table
ALTER TABLE research_data 
ADD COLUMN IF NOT EXISTS comment_pattern_analysis JSONB;

COMMENT ON COLUMN research_data.comment_pattern_analysis IS 'AI-generated comment pattern analysis (patterns, validation score, analyzedAt)';
