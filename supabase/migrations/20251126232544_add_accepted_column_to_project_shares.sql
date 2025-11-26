-- Add accepted column to project_shares if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'project_shares' AND column_name = 'accepted'
  ) THEN
    ALTER TABLE project_shares ADD COLUMN accepted BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;
END $$;

