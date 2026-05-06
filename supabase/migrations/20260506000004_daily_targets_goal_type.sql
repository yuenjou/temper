ALTER TABLE daily_targets
  ADD COLUMN IF NOT EXISTS goal_type TEXT
    CHECK (goal_type IN ('lose', 'maintain', 'gain'))
    DEFAULT 'maintain';
