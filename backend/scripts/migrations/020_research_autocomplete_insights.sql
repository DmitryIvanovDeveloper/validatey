-- Add autocomplete_insights column for Google Autocomplete research data
ALTER TABLE research_data ADD COLUMN IF NOT EXISTS autocomplete_insights JSONB;

COMMENT ON COLUMN research_data.autocomplete_insights IS 'Generated search phrases + Google Place Autocomplete results for market research.';
