-- Seed 10 different feedback comments for testing/demo
-- Run via Supabase SQL Editor or apply as migration

INSERT INTO feedback (type, text, user_id, page_url) VALUES
  ('feature_request', 'Add dark mode toggle for the dashboard. Many users work at night and would appreciate it.', 'seed-user-001', '/projects'),
  ('bug_report', 'Progress bar sometimes shows 0% even when responses exist. Refresh fixes it.', 'seed-user-002', '/projects/xxx/progress'),
  ('what_is_missing', 'Ability to export survey responses to CSV for offline analysis.', 'seed-user-003', '/projects'),
  ('other', 'Great product! The wizard flow for creating projects is very intuitive.', 'seed-user-004', '/projects/new'),
  ('feature_request', 'Bulk invite: paste a list of emails and send all at once instead of one by one.', 'seed-user-005', '/projects/xxx/invitations'),
  ('bug_report', 'Scenario AI formatting occasionally adds duplicate bullet points.', 'seed-user-006', '/projects/xxx'),
  ('what_is_missing', 'Notifications when someone completes a survey or when report is ready.', 'seed-user-007', '/'),
  ('feature_request', 'Filter feedback by type (bug/feature/other) in the admin panel.', 'seed-user-008', '/admin/feedback'),
  ('other', 'Would love to see more chart types in the report: bar charts, pie charts for clusters.', 'seed-user-009', '/projects/xxx/report'),
  ('bug_report', 'Share feedback widget button overlaps with page content on mobile view.', 'seed-user-010', '/projects'),
  -- Additional 10 for MCP/Supabase testing
  ('feature_request', 'Allow editing project hypothesis after creation without recreating the whole project.', 'seed-mcp-001', '/projects/xxx'),
  ('bug_report', 'WTP value in report sometimes displays as NaN when no responses yet.', 'seed-mcp-002', '/projects/xxx/report'),
  ('what_is_missing', 'Keyboard shortcuts for wizard steps: Next (Enter), Back (Esc).', 'seed-mcp-003', '/projects/new'),
  ('other', 'Teal accent color looks nice, fits the validation theme well.', 'seed-mcp-004', '/'),
  ('feature_request', 'Duplicate project button to clone segment, hypothesis and scenario.', 'seed-mcp-005', '/projects'),
  ('bug_report', 'Invitation table scrolls horizontally on small screens, hard to read.', 'seed-mcp-006', '/projects/xxx/invitations'),
  ('what_is_missing', 'Search/filter projects by name or status.', 'seed-mcp-007', '/projects'),
  ('other', 'AI hypothesis suggestions save a lot of time, thanks!', 'seed-mcp-008', '/projects/new'),
  ('feature_request', 'Schedule report generation and get email when ready.', 'seed-mcp-009', '/projects/xxx/report'),
  ('bug_report', 'Survey progress bar resets to 0 if user switches tab and comes back.', 'seed-mcp-010', '/survey/xxx');
