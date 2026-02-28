-- Reddit signals: upvotes (score) and thread depth for comments
ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS score INT NULL,
  ADD COLUMN IF NOT EXISTS depth INT NULL;

COMMENT ON COLUMN comments.score IS 'Reddit upvotes (score/ups); NULL for HN/LinkedIn/manual';
COMMENT ON COLUMN comments.depth IS 'Reddit thread depth (nesting level); NULL for other sources';
