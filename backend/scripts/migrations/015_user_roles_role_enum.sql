-- Use enum for user_roles.role instead of TEXT + CHECK. Idempotent: safe if 014 already created enum.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE app_role AS ENUM ('user', 'admin');
  END IF;
END
$$;

ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;

DO $$
BEGIN
  IF (SELECT udt_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_roles' AND column_name = 'role') = 'app_role' THEN
    NULL; /* already enum */
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
    ALTER TABLE user_roles ALTER COLUMN role DROP DEFAULT;
    ALTER TABLE user_roles ALTER COLUMN role TYPE app_role USING role::app_role;
    ALTER TABLE user_roles ALTER COLUMN role SET DEFAULT 'user'::app_role;
  END IF;
END
$$;

COMMENT ON TYPE app_role IS 'Application role: user or admin.';
