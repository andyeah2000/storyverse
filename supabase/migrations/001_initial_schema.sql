-- ============================================
-- STORYVERSE DATABASE SCHEMA
-- Run this in your Supabase SQL Editor
-- ============================================

-- ============================================
-- PROJECTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled Project',
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for user queries
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON projects(user_id);
CREATE INDEX IF NOT EXISTS projects_updated_at_idx ON projects(updated_at DESC);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own projects
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Collaborators can view shared projects" ON projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_shares
      WHERE project_shares.project_id = projects.id
        AND project_shares.accepted = TRUE
        AND project_shares.shared_with_user_id = auth.uid()
    )
  );

CREATE POLICY "Collaborators can update shared projects" ON projects
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM project_shares
      WHERE project_shares.project_id = projects.id
        AND project_shares.accepted = TRUE
        AND project_shares.permission = 'edit'
        AND project_shares.shared_with_user_id = auth.uid()
    )
  );

-- ============================================
-- USER SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- SHARED PROJECTS TABLE (for collaboration)
-- ============================================
CREATE TABLE IF NOT EXISTS project_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL DEFAULT 'Shared Project',
  shared_with_email TEXT NOT NULL,
  shared_with_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  permission TEXT NOT NULL CHECK (permission IN ('view', 'edit')),
  accepted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS project_shares_project_id_idx ON project_shares(project_id);
CREATE INDEX IF NOT EXISTS project_shares_email_idx ON project_shares(shared_with_email);
CREATE INDEX IF NOT EXISTS project_shares_user_idx ON project_shares(shared_with_user_id);

-- Enable RLS
ALTER TABLE project_shares ENABLE ROW LEVEL SECURITY;

-- RLS: Project owners can manage shares
CREATE POLICY "Project owners can view shares" ON project_shares
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects WHERE projects.id = project_shares.project_id AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can insert shares" ON project_shares
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects WHERE projects.id = project_shares.project_id AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can update shares" ON project_shares
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects WHERE projects.id = project_shares.project_id AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can delete shares" ON project_shares
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects WHERE projects.id = project_shares.project_id AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Invitees can view their shares" ON project_shares
  FOR SELECT USING (
    shared_with_user_id = auth.uid() OR shared_with_email = auth.jwt() ->> 'email'
  );

CREATE POLICY "Invitees can accept shares" ON project_shares
  FOR UPDATE USING (
    shared_with_user_id = auth.uid() OR shared_with_email = auth.jwt() ->> 'email'
  )
  WITH CHECK (
    shared_with_user_id = auth.uid()
  );

CREATE POLICY "Invitees can decline shares" ON project_shares
  FOR DELETE USING (
    shared_with_user_id = auth.uid() OR shared_with_email = auth.jwt() ->> 'email'
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- REALTIME
-- ============================================
-- Enable realtime for projects table
ALTER PUBLICATION supabase_realtime ADD TABLE projects;
