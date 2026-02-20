-- Add assumption_assessments column for per-assumption status + evidence
-- Goal: for each Key Assumption show status (confirmed | need_more | not_supported) and evidence (short "what confirms" or why need_more/not_supported)
ALTER TABLE research_data
ADD COLUMN IF NOT EXISTS assumption_assessments JSONB DEFAULT NULL;

COMMENT ON COLUMN research_data.assumption_assessments IS 'Per-assumption assessment: [{ "assumptionId": "uuid", "status": "confirmed"|"need_more"|"not_supported", "evidence": "1-2 sentences or null" }]. Filled after synthesis by GenerateAssumptionAssessmentsUseCase.';
