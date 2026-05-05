-- Enable Row Level Security on personal_records
ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to SELECT only their own rows
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'personal_records'
      AND policyname = 'users_select_own_personal_records'
  ) THEN
    CREATE POLICY "users_select_own_personal_records"
      ON personal_records
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;
