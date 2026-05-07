-- Trigger function: insert a personal record when a new set beats the user's
-- previous best weight for that exercise + rep count combination.
CREATE OR REPLACE FUNCTION check_and_insert_personal_record()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_max_weight numeric;
BEGIN
  SELECT user_id INTO v_user_id
  FROM workouts
  WHERE id = NEW.workout_id;

  IF v_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT MAX(weight) INTO v_max_weight
  FROM personal_records
  WHERE user_id = v_user_id
    AND exercise_id = NEW.exercise_id
    AND reps = NEW.reps;

  IF v_max_weight IS NULL OR NEW.weight > v_max_weight THEN
    INSERT INTO personal_records (user_id, exercise_id, reps, weight, weight_unit, achieved_at)
    VALUES (
      v_user_id,
      NEW.exercise_id,
      NEW.reps,
      NEW.weight,
      COALESCE(NEW.weight_unit, 'kg'),
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_personal_record ON sets;
CREATE TRIGGER trg_check_personal_record
  AFTER INSERT ON sets
  FOR EACH ROW
  EXECUTE FUNCTION check_and_insert_personal_record();
