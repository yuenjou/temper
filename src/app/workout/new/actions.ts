'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function createWorkout() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('workouts')
    .insert({ user_id: user.id, started_at: new Date().toISOString() })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function finishWorkout(workoutId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('workouts')
    .update({ finished_at: new Date().toISOString() })
    .eq('id', workoutId)
    .eq('user_id', user.id)

  if (error) throw error
  revalidatePath('/dashboard')
}

export async function getAllExercises() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('exercises')
    .select('id, name, category, muscle_group')
    .or(`is_default.eq.true,user_id.eq.${user.id}`)
    .order('name')

  if (error) throw error
  return data ?? []
}

export async function searchExercises(query: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('exercises')
    .select('id, name, category, muscle_group')
    .ilike('name', `%${query}%`)
    .or(`is_default.eq.true,user_id.eq.${user.id}`)

  if (error) throw error
  return data ?? []
}

export async function createCustomExercise(name: string, category: string, muscleGroup: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('exercises')
    .insert({ user_id: user.id, name, category, muscle_group: muscleGroup, is_default: false })
    .select('id, name, category, muscle_group')
    .single()

  if (error) throw error
  return data
}

export async function logSet(
  workoutId: string,
  exerciseId: string,
  reps: number,
  weight: number,
  weightUnit = 'kg',
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('sets')
    .insert({ workout_id: workoutId, exercise_id: exerciseId, reps, weight, weight_unit: weightUnit })
    .select('id, reps, weight, weight_unit')
    .single()

  if (error) throw error
  return data
}

export async function checkNewPR(exerciseId: string, reps: number): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString()
  const { data } = await supabase
    .from('personal_records')
    .select('id')
    .eq('user_id', user.id)
    .eq('exercise_id', exerciseId)
    .eq('reps', reps)
    .gte('achieved_at', fiveSecondsAgo)
    .maybeSingle()

  return !!data
}

export async function getPreviousSets(
  exerciseIds: string[],
  currentWorkoutId: string,
): Promise<Record<string, { reps: number; weight: number; weight_unit: string }>> {
  if (exerciseIds.length === 0) return {}
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return {}

  const { data: recentWorkouts } = await supabase
    .from('workouts')
    .select('id')
    .eq('user_id', user.id)
    .neq('id', currentWorkoutId)
    .not('finished_at', 'is', null)
    .order('started_at', { ascending: false })
    .limit(30)

  if (!recentWorkouts?.length) return {}

  const workoutIds = recentWorkouts.map(w => w.id)

  const { data: sets } = await supabase
    .from('sets')
    .select('exercise_id, reps, weight, weight_unit, workout_id')
    .in('exercise_id', exerciseIds)
    .in('workout_id', workoutIds)

  if (!sets?.length) return {}

  // workoutIds is newest-first; find the best set (highest weight) from the most recent workout per exercise
  const result: Record<string, { reps: number; weight: number; weight_unit: string }> = {}
  for (const workoutId of workoutIds) {
    const workoutSets = sets.filter(s => s.workout_id === workoutId)
    for (const s of workoutSets) {
      if (!result[s.exercise_id]) {
        const siblings = workoutSets.filter(x => x.exercise_id === s.exercise_id)
        const best = siblings.reduce((m, c) => (c.weight > m.weight ? c : m), siblings[0])
        result[s.exercise_id] = { reps: best.reps, weight: best.weight, weight_unit: best.weight_unit }
      }
    }
    if (Object.keys(result).length >= exerciseIds.length) break
  }

  return result
}

export async function deleteSet(setId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: set } = await supabase
    .from('sets')
    .select('workout_id')
    .eq('id', setId)
    .single()

  if (!set) throw new Error('Set not found')

  const { data: workout } = await supabase
    .from('workouts')
    .select('id')
    .eq('id', set.workout_id)
    .eq('user_id', user.id)
    .single()

  if (!workout) throw new Error('Unauthorized')

  const { error } = await supabase.from('sets').delete().eq('id', setId)
  if (error) throw error
}

export async function deleteWorkout(workoutId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: workout } = await supabase
    .from('workouts')
    .select('id')
    .eq('id', workoutId)
    .eq('user_id', user.id)
    .single()

  if (!workout) throw new Error('Unauthorized')

  await supabase.from('sets').delete().eq('workout_id', workoutId)

  const { error } = await supabase.from('workouts').delete().eq('id', workoutId)
  if (error) throw error

  revalidatePath('/workout/new')
  revalidatePath('/dashboard')
}
