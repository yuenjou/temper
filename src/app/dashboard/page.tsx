import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import NavBar from '@/components/NavBar'

type PR = {
  id: string
  exercise_id: string
  reps: number
  weight: number
  weight_unit: string
  achieved_at: string
  exercises: { name: string } | null
}

function calculateStreak(finishedAts: string[]): number {
  if (finishedAts.length === 0) return 0

  const dates = new Set(finishedAts.map(d => d.slice(0, 10)))

  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const yesterday = new Date(now)
  yesterday.setUTCDate(yesterday.getUTCDate() - 1)
  const yesterdayStr = yesterday.toISOString().slice(0, 10)

  const startStr = dates.has(todayStr) ? todayStr : (dates.has(yesterdayStr) ? yesterdayStr : null)
  if (!startStr) return 0

  let streak = 0
  const current = new Date(startStr + 'T00:00:00Z')
  while (true) {
    const dateStr = current.toISOString().slice(0, 10)
    if (!dates.has(dateStr)) break
    streak++
    current.setUTCDate(current.getUTCDate() - 1)
  }
  return streak
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: workouts }, { data: prs }, { data: finishedWorkouts }] = await Promise.all([
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
    supabase
      .from('workouts')
      .select('finished_at')
      .eq('user_id', user.id)
      .not('finished_at', 'is', null)
      .order('finished_at', { ascending: false }),
  ])

  const streak = calculateStreak((finishedWorkouts ?? []).map(w => w.finished_at as string))

  return (
    <>
    <NavBar />
    <div className="min-h-screen bg-black text-white p-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <Link
            href="/measurements"
            className="border border-zinc-600 hover:border-zinc-400 px-4 py-2 rounded font-medium text-sm text-zinc-300 hover:text-white"
          >
            Measurements
          </Link>
          <Link
            href="/workout/new"
            className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded font-medium text-sm"
          >
            Start Workout
          </Link>
        </div>
      </div>

      {streak > 0 && (
        <p className="text-lg font-semibold mb-6">🔥 {streak} day streak</p>
      )}

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
    </>
  )
}
