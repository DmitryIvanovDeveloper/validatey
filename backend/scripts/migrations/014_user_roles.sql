-- Store user roles for admin access. No FK to Auth (Auth is external).
-- First admin: INSERT INTO user_roles (user_id, role) VALUES ('<auth-user-uuid>', 'admin');

CREATE TABLE IF NOT EXISTS user_roles (
  user_id TEXT PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'))
);

CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

COMMENT ON TABLE user_roles IS 'App roles; default role is user when no row exists.';
