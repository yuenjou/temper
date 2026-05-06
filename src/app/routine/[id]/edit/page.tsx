import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import EditRoutineForm from './EditRoutineForm'

type Exercise = { id: string; name: string; category: string; muscle_group: string }

type RoutineExerciseRow = {
  order_index: number
  exercises: Exercise | null
}

type RoutineRow = {
  id: string
  name: string
  routine_exercises: RoutineExerciseRow[]
}

export default async function EditRoutinePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rawRoutine } = await supabase
    .from('routines')
    .select('id, name, routine_exercises(order_index, exercises(id, name, category, muscle_group))')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!rawRoutine) redirect('/workout/new')

  const routine = rawRoutine as unknown as RoutineRow

  const { data: rawSets } = await supabase
    .from('routine_sets')
    .select('exercise_id, reps, weight, weight_unit, order_index')
    .eq('routine_id', id)
    .order('order_index')

  const exercises = [...routine.routine_exercises]
    .sort((a, b) => a.order_index - b.order_index)
    .filter(re => re.exercises !== null)
    .map(re => re.exercises!)

  const plannedSets: Record<string, { reps: number; weight: number; weight_unit: string }[]> = {}
  for (const s of rawSets ?? []) {
    if (!plannedSets[s.exercise_id]) plannedSets[s.exercise_id] = []
    plannedSets[s.exercise_id].push({ reps: s.reps, weight: s.weight, weight_unit: s.weight_unit })
  }

  return (
    <EditRoutineForm
      routineId={id}
      initialName={routine.name}
      initialExercises={exercises}
      initialPlannedSets={plannedSets}
    />
  )
}
