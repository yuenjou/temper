CREATE TABLE food_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  calories NUMERIC NOT NULL,
  protein NUMERIC DEFAULT 0,
  carbs NUMERIC DEFAULT 0,
  fat NUMERIC DEFAULT 0,
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snacks')) NOT NULL,
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE food_favourites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  calories NUMERIC NOT NULL,
  protein NUMERIC DEFAULT 0,
  carbs NUMERIC DEFAULT 0,
  fat NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE daily_targets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  calories NUMERIC DEFAULT 2000,
  protein NUMERIC DEFAULT 150,
  carbs NUMERIC DEFAULT 200,
  fat NUMERIC DEFAULT 60,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE food_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_favourites ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own food_entries" ON food_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own food_favourites" ON food_favourites FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own daily_targets" ON daily_targets FOR ALL USING (auth.uid() = user_id);
