-- Seed 10 more feedback entries; several share the same themes for AI analysis demo

INSERT INTO feedback (type, text, user_id, page_url) VALUES
  -- Theme: slow loading / performance (4)
  ('bug_report', 'Report page takes 10+ seconds to load when there are many responses. Very frustrating.', 'seed-user-011', '/projects/abc/report'),
  ('bug_report', 'Dashboard is slow on first load. Could you optimize or add a loading skeleton?', 'seed-user-012', '/projects'),
  ('feature_request', 'Please cache the report so it opens instantly after the first load.', 'seed-user-013', '/projects/xyz/report'),
  ('other', 'Everything works but the app feels sluggish when switching between projects. Maybe lazy load?', 'seed-user-014', '/projects'),
  -- Theme: mobile / small screens (3)
  ('bug_report', 'On mobile the invitation table is cut off and I cannot scroll horizontally.', 'seed-user-015', '/projects/abc/invitations'),
  ('feature_request', 'Make the feedback widget and admin list usable on small screens and tablets.', 'seed-user-016', '/admin/feedback'),
  ('what_is_missing', 'Responsive layout for the survey on mobile – currently text is too small.', 'seed-user-017', '/survey'),
  -- Theme: export / download (2)
  ('feature_request', 'Export to Excel in addition to CSV would be great for our team.', 'seed-user-018', '/projects/abc/responses'),
  ('what_is_missing', 'Bulk download of all report PDFs for multiple projects at once.', 'seed-user-019', '/projects'),
  -- Other (1)
  ('other', 'Early signals feature is helpful but I wish I could edit the AI summary before saving.', 'seed-user-020', '/projects/abc/early-signals');
