'use server'

import { createClient } from '@/lib/supabase-server'

export async function getWorkoutDates(startDate: string, endDate: string): Promise<string[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('workouts')
    .select('finished_at')
    .eq('user_id', user.id)
    .not('finished_at', 'is', null)
    .gte('finished_at', startDate)
    .lte('finished_at', endDate + 'T23:59:59.999Z')

  if (!data) return []
  return data.map(w => (w.finished_at as string).slice(0, 10))
}

export type SetDetail = {
  id: string
  reps: number
  weight: number
  weight_unit: string
}

export type ExerciseDetail = {
  id: string
  name: string
  muscle_group: string | null
  sets: SetDetail[]
}

export type WorkoutDetail = {
  id: string
  name: string | null
  started_at: string
  finished_at: string
  exercises: ExerciseDetail[]
}

function nextDayStr(date: string): string {
  const d = new Date(date + 'T00:00:00.000Z')
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

export type MeasurementEntry = {
  id: string
  type: string
  value: number
  unit: string
}

export async function getMeasurementsForDate(date: string): Promise<MeasurementEntry[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('measurements')
    .select('id, type, value, unit')
    .eq('user_id', user.id)
    .gte('recorded_at', date + 'T00:00:00.000Z')
    .lt('recorded_at', nextDayStr(date) + 'T00:00:00.000Z')
    .order('recorded_at')

  return (data ?? []) as MeasurementEntry[]
}

export type FoodEntry = {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  meal_type: string
}

export async function getFoodEntriesForDate(date: string): Promise<FoodEntry[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('food_entries')
    .select('id, name, calories, protein, carbs, fat, meal_type')
    .eq('user_id', user.id)
    .gte('logged_at', date + 'T00:00:00.000Z')
    .lt('logged_at', nextDayStr(date) + 'T00:00:00.000Z')
    .order('logged_at')

  return (data ?? []) as FoodEntry[]
}

export async function getWorkoutsForDate(date: string): Promise<WorkoutDetail[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const nextDateStr = nextDayStr(date)

  const { data } = await supabase
    .from('workouts')
    .select('id, name, started_at, finished_at, sets(id, reps, weight, weight_unit, exercises(id, name, muscle_group))')
    .eq('user_id', user.id)
    .not('finished_at', 'is', null)
    .gte('finished_at', date + 'T00:00:00.000Z')
    .lt('finished_at', nextDateStr + 'T00:00:00.000Z')
    .order('started_at')

  if (!data) return []

  // Group sets by exercise for each workout
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map(w => {
    const exerciseMap = new Map<string, ExerciseDetail>()
    for (const set of (w.sets ?? [])) {
      const ex = set.exercises
      if (!ex) continue
      if (!exerciseMap.has(ex.id)) {
        exerciseMap.set(ex.id, {
          id: ex.id,
          name: ex.name,
          muscle_group: ex.muscle_group ?? null,
          sets: [],
        })
      }
      exerciseMap.get(ex.id)!.sets.push({
        id: set.id,
        reps: set.reps,
        weight: set.weight,
        weight_unit: set.weight_unit,
      })
    }
    return {
      id: w.id,
      name: w.name ?? null,
      started_at: w.started_at,
      finished_at: w.finished_at,
      exercises: Array.from(exerciseMap.values()),
    }
  })
}
