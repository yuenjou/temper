import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

type PR = {
  id: string
  reps: number
  weight: number
  weight_unit: string
  achieved_at: string
}

type SetRow = {
  id: string
  reps: number
  weight: number
  weight_unit: string
  created_at: string
  workouts: { started_at: string } | null
}

export default async function ExercisePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: exercise }, { data: prs }, { data: workoutRows }] = await Promise.all([
    supabase
      .from('exercises')
      .select('id, name, category, muscle_group')
      .eq('id', id)
      .or(`is_default.eq.true,user_id.eq.${user.id}`)
      .single(),
    supabase
      .from('personal_records')
      .select('id, reps, weight, weight_unit, achieved_at')
      .eq('exercise_id', id)
      .eq('user_id', user.id)
      .order('reps', { ascending: true })
      .order('weight', { ascending: false }),
    supabase
      .from('workouts')
      .select('id')
      .eq('user_id', user.id),
  ])

  if (!exercise) redirect('/dashboard')

  const workoutIds = workoutRows?.map(w => w.id) ?? []

  const { data: sets } = workoutIds.length > 0
    ? await supabase
        .from('sets')
        .select('id, reps, weight, weight_unit, created_at, workouts(started_at)')
        .eq('exercise_id', id)
        .in('workout_id', workoutIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  // Group PRs by rep count
  const prsByRep = (prs ?? []).reduce<Record<number, PR[]>>((acc, pr) => {
    if (!acc[pr.reps]) acc[pr.reps] = []
    acc[pr.reps].push(pr as PR)
    return acc
  }, {})
  const repGroups = Object.keys(prsByRep)
    .map(Number)
    .sort((a, b) => a - b)

  return (
    <div className="min-h-screen bg-black text-white p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard" className="text-zinc-400 hover:text-white text-sm">← Dashboard</Link>
      </div>

      <h1 className="text-2xl font-bold">{exercise.name}</h1>
      {(exercise.category || exercise.muscle_group) && (
        <p className="text-zinc-400 text-sm mt-1">
          {[exercise.category, exercise.muscle_group].filter(Boolean).join(' · ')}
        </p>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Personal Records</h2>
        {repGroups.length === 0 ? (
          <p className="text-zinc-400 text-sm">No records yet.</p>
        ) : (
          <div className="space-y-4">
            {repGroups.map(reps => (
              <div key={reps} className="border border-zinc-700 rounded-lg p-4">
                <p className="text-zinc-400 text-xs mb-2 uppercase tracking-wide">
                  {reps} Rep{reps !== 1 ? 's' : ''}
                </p>
                <div className="space-y-1">
                  {prsByRep[reps].map((pr, i) => (
                    <div key={pr.id} className="flex justify-between items-center text-sm">
                      <span className={i === 0 ? 'text-yellow-400 font-semibold' : 'text-zinc-300'}>
                        {pr.weight} {pr.weight_unit}
                        {i === 0 && <span className="ml-1.5 text-xs">🏆</span>}
                      </span>
                      <span className="text-zinc-500 text-xs">
                        {new Date(pr.achieved_at).toLocaleDateString(undefined, {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Set History</h2>
        {(!sets || sets.length === 0) ? (
          <p className="text-zinc-400 text-sm">No sets logged yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-zinc-500 text-left border-b border-zinc-800">
                <th className="pb-2">Date</th>
                <th className="pb-2">Reps</th>
                <th className="pb-2">Weight</th>
              </tr>
            </thead>
            <tbody>
              {(sets as unknown as SetRow[]).map(s => (
                <tr key={s.id} className="border-b border-zinc-800">
                  <td className="py-2 text-zinc-400">
                    {new Date(s.workouts?.started_at ?? s.created_at).toLocaleDateString(undefined, {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </td>
                  <td className="py-2">{s.reps}</td>
                  <td className="py-2">{s.weight} {s.weight_unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
