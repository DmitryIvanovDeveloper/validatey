-- Workspace module: organize projects into workspaces for better user experience

-- Create workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT workspaces_name_not_empty CHECK (LENGTH(TRIM(name)) > 0)
);

-- Add workspace_id to projects table (nullable initially for migration)
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_workspaces_user_id ON workspaces(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_workspace_id ON projects(workspace_id);

-- Enable Row Level Security
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- RLS policies for workspaces
CREATE POLICY "Users can view own workspaces"
    ON workspaces FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own workspaces"
    ON workspaces FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workspaces"
    ON workspaces FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workspaces"
    ON workspaces FOR DELETE
    USING (auth.uid() = user_id);

-- Add comments
COMMENT ON TABLE workspaces IS 'User workspaces to organize projects';
COMMENT ON COLUMN workspaces.name IS 'Workspace name (required, 1-255 characters)';
COMMENT ON COLUMN workspaces.user_id IS 'Reference to auth.users(id) - workspace owner';
COMMENT ON COLUMN projects.workspace_id IS 'Reference to workspace - projects belong to workspaces';

-- Create function to create default workspace for user
CREATE OR REPLACE FUNCTION create_default_workspace_for_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create default workspace for new user
    INSERT INTO workspaces (user_id, name)
    VALUES (NEW.id, 'My Workspace');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create default workspace for new users
DROP TRIGGER IF EXISTS create_default_workspace_trigger ON auth.users;
CREATE TRIGGER create_default_workspace_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_workspace_for_user();