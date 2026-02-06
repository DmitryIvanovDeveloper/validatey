-- Store user roles for admin access. No FK to Auth (Auth is external).
-- First admin: INSERT INTO user_roles (user_id, role) VALUES ('<auth-user-uuid>', 'admin');

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE app_role AS ENUM ('user', 'admin');
  END IF;
END
$$;

COMMENT ON TYPE app_role IS 'Application role: user or admin.';

CREATE TABLE IF NOT EXISTS user_roles (
  user_id TEXT PRIMARY KEY,
  role app_role NOT NULL DEFAULT 'user'::app_role
);

CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

COMMENT ON TABLE user_roles IS 'App roles; default role is user when no row exists.';
