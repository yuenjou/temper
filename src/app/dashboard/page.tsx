import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: workouts } = await supabase
    .from('workouts')
    .select('id, name, started_at, sets(id)')
    .eq('user_id', user.id)
    .order('started_at', { ascending: false })

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
        <div className="space-y-3">
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
    </div>
  )
}
