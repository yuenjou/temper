import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

type PR = {
  id: string
  exercise_id: string
  reps: number
  weight: number
  weight_unit: string
  achieved_at: string
  exercises: { name: string } | null
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: workouts }, { data: prs }] = await Promise.all([
    supabase
      .from('workouts')
      .select('id, name, started_at, sets(id)')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false }),
    supabase
      .from('personal_records')
      .select('id, exercise_id, reps, weight, weight_unit, achieved_at, exercises(name)')
      .eq('user_id', user.id)
      .order('achieved_at', { ascending: false })
      .limit(20),
  ])

  return (
    <div className="min-h-screen bg-black text-white p-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link
          href="/workout/new"
          className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded font-medium text-sm"
        >
          Start Workout
        </Link>
      </div>

      {(!workouts || workouts.length === 0) ? (
        <p className="text-zinc-400">No workouts yet. Start one!</p>
      ) : (
        <div className="space-y-3 mb-10">
          {workouts.map(workout => (
            <div key={workout.id} className="border border-zinc-700 rounded-lg p-4 flex justify-between items-center">
              <div>
                <p className="font-medium">{workout.name ?? 'Workout'}</p>
                <p className="text-zinc-400 text-sm mt-0.5">
                  {new Date(workout.started_at).toLocaleDateString(undefined, {
                    weekday: 'short', month: 'short', day: 'numeric',
                  })}
                </p>
              </div>
              <span className="text-zinc-400 text-sm">
                {(workout.sets as { id: string }[] | null)?.length ?? 0} sets
              </span>
            </div>
          ))}
        </div>
      )}

      <h2 className="text-xl font-bold mb-4">Personal Records</h2>
      {(!prs || prs.length === 0) ? (
        <p className="text-zinc-400">No personal records yet.</p>
      ) : (
        <div className="space-y-2">
          {(prs as unknown as PR[]).map(pr => (
            <div key={pr.id} className="border border-zinc-700 rounded-lg p-4 flex justify-between items-center">
              <div>
                <Link
                  href={`/exercise/${pr.exercise_id}`}
                  className="font-medium hover:text-zinc-300 underline underline-offset-2"
                >
                  {pr.exercises?.name ?? 'Unknown exercise'}
                </Link>
                <p className="text-zinc-400 text-sm mt-0.5">{pr.reps} rep{pr.reps !== 1 ? 's' : ''}</p>
              </div>
              <div className="text-right">
                <p className="text-yellow-400 font-semibold">{pr.weight} {pr.weight_unit}</p>
                <p className="text-zinc-500 text-xs mt-0.5">
                  {new Date(pr.achieved_at).toLocaleDateString(undefined, {
                    month: 'short', day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
