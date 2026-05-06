import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import WorkoutLogger from './WorkoutLogger'

type Exercise = { id: string; name: string; category: string; muscle_group: string }
type WorkoutSet = { id: string; reps: number; weight: number; weight_unit: string }

type RoutineExRow = {
  order_index: number
  exercises: Exercise | null
}

export default async function WorkoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ routine?: string }>
}) {
  const { id } = await params
  const { routine: routineId } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: workout } = await supabase
    .from('workouts')
    .select('id, name, started_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!workout) redirect('/workout/new')

  let initialExercises: Exercise[] = []
  let initialSets: Record<string, WorkoutSet[]> = {}

  if (routineId) {
    const [{ data: rows }, { data: sets }] = await Promise.all([
      supabase
        .from('routine_exercises')
        .select('order_index, exercises(id, name, category, muscle_group)')
        .eq('routine_id', routineId)
        .order('order_index'),
      supabase
        .from('sets')
        .select('id, reps, weight, weight_unit, exercise_id')
        .eq('workout_id', id),
    ])

    if (rows) {
      initialExercises = (rows as unknown as RoutineExRow[])
        .sort((a, b) => a.order_index - b.order_index)
        .map(r => r.exercises)
        .filter((e): e is Exercise => e !== null)
    }

    if (sets) {
      for (const s of sets) {
        const { exercise_id, ...set } = s
        if (!initialSets[exercise_id]) initialSets[exercise_id] = []
        initialSets[exercise_id].push(set)
      }
    }
  }

  return (
    <WorkoutLogger
      workoutId={workout.id}
      workoutName={workout.name}
      initialExercises={initialExercises}
      initialSets={initialSets}
    />
  )
}
