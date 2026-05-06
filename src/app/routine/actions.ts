'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

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
  redirect(`/workout/${workout.id}?routine=${routineId}`)
}

export async function createRoutine(name: string, exerciseIds: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: routine, error } = await supabase
    .from('routines')
    .insert({ user_id: user.id, name: name.trim() })
    .select('id')
    .single()

  if (error) throw error

  if (exerciseIds.length > 0) {
    const { error: reError } = await supabase
      .from('routine_exercises')
      .insert(
        exerciseIds.map((exerciseId, i) => ({
          routine_id: routine.id,
          exercise_id: exerciseId,
          order_index: i,
        }))
      )
    if (reError) throw reError
  }

  revalidatePath('/workout/new')
  redirect('/workout/new')
}
