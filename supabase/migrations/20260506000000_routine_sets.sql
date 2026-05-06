CREATE TABLE IF NOT EXISTS routine_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id uuid NOT NULL,
  exercise_id uuid NOT NULL,
  reps integer NOT NULL,
  weight numeric NOT NULL,
  weight_unit text NOT NULL DEFAULT 'kg',
  order_index integer NOT NULL DEFAULT 0
);

ALTER TABLE routine_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own routine sets" ON routine_sets
  FOR ALL
  USING (
    routine_id IN (
      SELECT id FROM routines WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    routine_id IN (
      SELECT id FROM routines WHERE user_id = auth.uid()
    )
  );
