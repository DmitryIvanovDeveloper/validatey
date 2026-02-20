-- View for querying assumption analysis in Supabase (status + evidence per Key Assumption)
-- One row per assumption assessment: project_id, assumption_id, status, evidence
CREATE OR REPLACE VIEW research_assumption_analysis AS
SELECT
  rd.project_id,
  elem->>'assumptionId' AS assumption_id,
  elem->>'status' AS status,
  elem->>'evidence' AS evidence
FROM research_data rd,
  jsonb_array_elements(COALESCE(rd.assumption_assessments, '[]'::jsonb)) AS elem
WHERE rd.assumption_assessments IS NOT NULL
  AND jsonb_array_length(COALESCE(rd.assumption_assessments, '[]'::jsonb)) > 0;

COMMENT ON VIEW research_assumption_analysis IS 'Per-project assumption analysis: status (confirmed/need_more/not_supported) and evidence text for each Key Assumption';
