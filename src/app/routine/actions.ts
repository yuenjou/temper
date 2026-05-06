'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

type PlannedSet = { reps: number; weight: number; weight_unit?: string }
type ExerciseInput = { id: string; sets: PlannedSet[] }

export async function createAndStartWorkout() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('workouts')
    .insert({ user_id: user.id, started_at: new Date().toISOString() })
    .select('id')
    .single()

  if (error) throw error
  redirect(`/workout/${data.id}`)
}

export async function startRoutineWorkout(routineId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: routine } = await supabase
    .from('routines')
    .select('name')
    .eq('id', routineId)
    .eq('user_id', user.id)
    .single()

  if (!routine) throw new Error('Routine not found')

  const { data: workout, error } = await supabase
    .from('workouts')
    .insert({ user_id: user.id, name: routine.name, started_at: new Date().toISOString() })
    .select('id')
    .single()

  if (error) throw error

  const { data: routineSets } = await supabase
    .from('routine_sets')
    .select('exercise_id, reps, weight, weight_unit, order_index')
    .eq('routine_id', routineId)
    .order('order_index')

  if (routineSets && routineSets.length > 0) {
    await supabase.from('sets').insert(
      routineSets.map(s => ({
        workout_id: workout.id,
        exercise_id: s.exercise_id,
        reps: s.reps,
        weight: s.weight,
        weight_unit: s.weight_unit,
      }))
    )
  }

  redirect(`/workout/${workout.id}?routine=${routineId}`)
}

export async function createRoutine(name: string, exercises: ExerciseInput[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: routine, error } = await supabase
    .from('routines')
    .insert({ user_id: user.id, name: name.trim() })
    .select('id')
    .single()

  if (error) throw error

  if (exercises.length > 0) {
    const { error: reError } = await supabase
      .from('routine_exercises')
      .insert(
        exercises.map((ex, i) => ({
          routine_id: routine.id,
          exercise_id: ex.id,
          order_index: i,
        }))
      )
    if (reError) throw reError
  }

  const allSets = exercises.flatMap((ex, _i) =>
    ex.sets.map((s, j) => ({
      routine_id: routine.id,
      exercise_id: ex.id,
      reps: s.reps,
      weight: s.weight,
      weight_unit: s.weight_unit ?? 'kg',
      order_index: j,
    }))
  )

  if (allSets.length > 0) {
    const { error: rsError } = await supabase.from('routine_sets').insert(allSets)
    if (rsError) throw rsError
  }

  revalidatePath('/workout/new')
  redirect('/workout/new')
}
