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
