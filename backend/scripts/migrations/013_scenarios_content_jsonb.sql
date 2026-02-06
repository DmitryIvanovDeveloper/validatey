-- Store scenario content (questions) as JSONB instead of TEXT
-- Converts existing content: valid JSON -> jsonb; plain text -> { "questions": [ { "type": "open_ended", "text": "<content>" } ] }

CREATE OR REPLACE FUNCTION try_content_to_jsonb(s text)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
BEGIN
  IF s IS NULL OR trim(s) = '' THEN
    RETURN '{}'::jsonb;
  END IF;
  RETURN s::jsonb;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'questions',
    jsonb_build_array(
      jsonb_build_object('type', 'open_ended', 'text', COALESCE(trim(s), ''))
    )
  );
END;
$$;

ALTER TABLE scenarios
  ALTER COLUMN content TYPE jsonb
  USING try_content_to_jsonb(content);

ALTER TABLE scenarios
  ALTER COLUMN content SET DEFAULT '{}'::jsonb;

DROP FUNCTION IF EXISTS try_content_to_jsonb(text);

COMMENT ON COLUMN scenarios.content IS 'Scenario payload as JSON (e.g. { "questions": [...] })';
