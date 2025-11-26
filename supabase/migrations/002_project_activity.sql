-- ============================================
-- PROJECT ACTIVITY TABLE
-- Tracks user actions for audit logging and collaboration history
-- ============================================

-- First, ensure project_shares has required columns (for compatibility with existing databases)
DO $$ 
BEGIN
  -- Add accepted column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'project_shares' AND column_name = 'accepted'
  ) THEN
    ALTER TABLE project_shares ADD COLUMN accepted BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;
  
  -- Add shared_with_user_id column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'project_shares' AND column_name = 'shared_with_user_id'
  ) THEN
    ALTER TABLE project_shares ADD COLUMN shared_with_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS project_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('edit', 'create', 'delete', 'share', 'accept_share', 'decline_share', 'revoke_share')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS project_activity_project_id_idx ON project_activity(project_id);
CREATE INDEX IF NOT EXISTS project_activity_user_id_idx ON project_activity(user_id);
CREATE INDEX IF NOT EXISTS project_activity_created_at_idx ON project_activity(created_at DESC);

-- Enable RLS
ALTER TABLE project_activity ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can view activity for projects they have access to
DROP POLICY IF EXISTS "Users can view activity for accessible projects" ON project_activity;
CREATE POLICY "Users can view activity for accessible projects" ON project_activity
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_activity.project_id
        AND (
          projects.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM project_shares
            WHERE project_shares.project_id = projects.id
              AND project_shares.accepted = TRUE
              AND project_shares.shared_with_user_id = auth.uid()
          )
        )
    )
  );

-- Users can insert activity for projects they can edit
DROP POLICY IF EXISTS "Users can insert activity for editable projects" ON project_activity;
CREATE POLICY "Users can insert activity for editable projects" ON project_activity
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_activity.project_id
        AND (
          projects.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM project_shares
            WHERE project_shares.project_id = projects.id
              AND project_shares.accepted = TRUE
              AND project_shares.permission = 'edit'
              AND project_shares.shared_with_user_id = auth.uid()
          )
        )
    )
    AND project_activity.user_id = auth.uid()
  );

