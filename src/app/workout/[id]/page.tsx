import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import WorkoutLogger from './WorkoutLogger'
import WorkoutSummary from './WorkoutSummary'
import { getPreviousSets } from '../new/actions'

type Exercise = { id: string; name: string; category: string; muscle_group: string }
type WorkoutSet = { id: string; reps: number; weight: number; weight_unit: string }

type RoutineExRow = {
  order_index: number
  exercises: Exercise | null
}

type SetRow = {
  id: string
  reps: number
  weight: number
  weight_unit: string
  exercise_id: string
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
    .select('id, name, started_at, finished_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!workout) redirect('/workout/new')

  // Finished workout → show read-only summary with delete
  if (workout.finished_at) {
    const { data: rawSets } = await supabase
      .from('sets')
      .select('id, reps, weight, weight_unit, exercise_id, exercises(id, name, category, muscle_group)')
      .eq('workout_id', id)
      .order('created_at')

    const exerciseMap = new Map<string, Exercise & { sets: WorkoutSet[] }>()
    for (const s of (rawSets ?? []) as unknown as SetRow[]) {
      if (!s.exercises) continue
      if (!exerciseMap.has(s.exercise_id)) {
        exerciseMap.set(s.exercise_id, { ...s.exercises, sets: [] })
      }
      exerciseMap.get(s.exercise_id)!.sets.push({
        id: s.id, reps: s.reps, weight: s.weight, weight_unit: s.weight_unit,
      })
    }

    return (
      <WorkoutSummary
        workoutId={workout.id}
        workoutName={workout.name}
        startedAt={workout.started_at}
        finishedAt={workout.finished_at}
        initialEntries={[...exerciseMap.values()]}
      />
    )
  }

  // Active workout → live logger
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

  const initialPrevSets = initialExercises.length > 0
    ? await getPreviousSets(initialExercises.map(e => e.id), workout.id)
    : {}

  return (
    <WorkoutLogger
      workoutId={workout.id}
      workoutName={workout.name}
      startedAt={workout.started_at}
      initialExercises={initialExercises}
      initialSets={initialSets}
      initialPrevSets={initialPrevSets}
    />
  )
}
