-- Backfill: create "Round 1" for every project that has no rounds, and assign existing
-- invitations, scenarios, and reports (with round_id IS NULL) to that round.
-- Use case: projects created before rounds existed (e.g. "Validatey Product-Market Validation").

-- 1. Insert one round per project that has zero rounds
INSERT INTO rounds (id, project_id, parent_round_id, title, status, type, sort_order, results, created_at, updated_at)
SELECT
  gen_random_uuid(),
  p.id,
  NULL,
  'Round 1',
  'completed',
  'survey',
  0,
  NULL,
  now(),
  now()
FROM projects p
WHERE NOT EXISTS (SELECT 1 FROM rounds r WHERE r.project_id = p.id);

-- 2. Assign existing invitations (round_id IS NULL) to their project's first round
UPDATE invitations i
SET round_id = (
  SELECT r.id
  FROM rounds r
  WHERE r.project_id = i.project_id
  ORDER BY r.sort_order ASC, r.created_at ASC
  LIMIT 1
)
WHERE i.round_id IS NULL;

-- 3. Assign existing scenarios (round_id IS NULL) to their project's first round
UPDATE scenarios s
SET round_id = (
  SELECT r.id
  FROM rounds r
  WHERE r.project_id = s.project_id
  ORDER BY r.sort_order ASC, r.created_at ASC
  LIMIT 1
)
WHERE s.round_id IS NULL;

-- 4. Assign existing reports (round_id IS NULL) to their project's first round
UPDATE reports rep
SET round_id = (
  SELECT r.id
  FROM rounds r
  WHERE r.project_id = rep.project_id
  ORDER BY r.sort_order ASC, r.created_at ASC
  LIMIT 1
)
WHERE rep.round_id IS NULL;
