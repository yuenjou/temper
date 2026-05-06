import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import NavBar from '@/components/NavBar'
import ForgeIcon from '@/components/ForgeIcon'
import { createAndStartWorkout, startRoutineWorkout } from '@/app/routine/actions'

type RoutineExercise = {
  order_index: number
  exercises: { id: string; name: string } | null
}

type Routine = {
  id: string
  name: string
  routine_exercises: RoutineExercise[]
}

type Workout = {
  id: string
  name: string | null
  started_at: string
  finished_at: string | null
}

export default async function WorkoutNewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: rawRoutines }, { data: recentWorkouts }] = await Promise.all([
    supabase
      .from('routines')
      .select('id, name, routine_exercises(order_index, exercises(id, name))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('workouts')
      .select('id, name, started_at, finished_at')
      .eq('user_id', user.id)
      .not('finished_at', 'is', null)
      .order('started_at', { ascending: false })
      .limit(5),
  ])

  const routines = ((rawRoutines ?? []) as unknown as Routine[]).map(r => ({
    ...r,
    routine_exercises: [...r.routine_exercises].sort((a, b) => a.order_index - b.order_index),
  }))

  const typedWorkouts = (recentWorkouts ?? []) as Workout[]

  return (
    <>
      <NavBar />
      <main className="forge-main" style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 96 }}>

        {/* Header */}
        <section style={{ padding: '20px 24px 20px' }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0 }}>Workout</h1>
        </section>

        {/* Start Workout CTA */}
        <section style={{ padding: '0 20px 28px' }}>
          <form action={createAndStartWorkout}>
            <button type="submit" className="forge-btn-primary">
              <ForgeIcon name="play" size={20} color="#fff" />
              Start Empty Workout
            </button>
          </form>
        </section>

        {/* My Routines */}
        <section style={{ padding: '0 20px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <p className="forge-eyebrow">My Routines</p>
            <Link href="/routine/new" style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}>
              + New
            </Link>
          </div>

          {routines.length === 0 ? (
            <div className="forge-card" style={{ textAlign: 'center', padding: '32px 20px' }}>
              <ForgeIcon name="dumbbell" size={40} color="var(--text-tertiary)" />
              <p style={{ color: 'var(--text-secondary)', margin: '14px 0 4px', fontWeight: 500 }}>No routines yet</p>
              <p style={{ color: 'var(--text-tertiary)', fontSize: 14, margin: 0 }}>Save a routine to start workouts faster</p>
              <Link href="/routine/new" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                marginTop: 18, padding: '10px 20px',
                background: 'var(--accent-soft)', color: 'var(--accent)',
                borderRadius: 'var(--r-pill)', fontSize: 14, fontWeight: 600,
                textDecoration: 'none',
              }}>
                <ForgeIcon name="plus" size={14} color="var(--accent)" />
                Create Routine
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {routines.map(routine => {
                const exNames = routine.routine_exercises
                  .map(re => re.exercises?.name)
                  .filter((n): n is string => !!n)
                const preview = exNames.slice(0, 3).join(', ') + (exNames.length > 3 ? ', …' : '')
                return (
                  <div key={routine.id} className="forge-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: 17, margin: 0, letterSpacing: '-0.01em' }}>{routine.name}</p>
                        {preview && (
                          <p style={{ color: 'var(--text-tertiary)', fontSize: 13, margin: '4px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {preview}
                          </p>
                        )}
                        <p style={{ color: 'var(--text-tertiary)', fontSize: 12, margin: '4px 0 0' }}>
                          {exNames.length} exercise{exNames.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <Link href={`/routine/${routine.id}/edit`} style={{
                          padding: '9px 16px',
                          background: 'var(--surface-2)', color: 'var(--text-secondary)',
                          borderRadius: 'var(--r-pill)', fontSize: 14, fontWeight: 600,
                          textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
                        }}>Edit</Link>
                        <form action={startRoutineWorkout.bind(null, routine.id)}>
                          <button type="submit" style={{
                            padding: '9px 20px',
                            background: 'var(--accent)', color: '#fff',
                            borderRadius: 'var(--r-pill)', fontSize: 14, fontWeight: 600,
                            cursor: 'pointer',
                          }}>Start</button>
                        </form>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Routine Analysis - coming soon */}
        <section style={{ padding: '0 20px 28px' }}>
          <p className="forge-eyebrow" style={{ marginBottom: 12 }}>Routine Analysis</p>
          <div className="forge-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ForgeIcon name="chart" size={18} color="var(--text-tertiary)" />
              <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-secondary)' }}>Muscle Group Heatmap</span>
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
              background: 'var(--surface-2)', color: 'var(--text-tertiary)',
              padding: '3px 8px', borderRadius: 'var(--r-pill)',
            }}>Coming Soon</span>
          </div>
        </section>

        {/* Exercise Library */}
        <section style={{ padding: '0 20px 28px' }}>
          <p className="forge-eyebrow" style={{ marginBottom: 12 }}>Exercise Library</p>
          <div className="forge-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: 0.7 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ForgeIcon name="search" size={18} color="var(--text-tertiary)" />
              <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-secondary)' }}>Browse all exercises</span>
            </div>
            <ForgeIcon name="chevron-right" size={16} color="var(--text-tertiary)" />
          </div>
        </section>

        {/* Workout History */}
        <section style={{ padding: '0 20px' }}>
          <p className="forge-eyebrow" style={{ marginBottom: 12 }}>History</p>
          {typedWorkouts.length === 0 ? (
            <div className="forge-card" style={{ textAlign: 'center', padding: '24px 20px' }}>
              <p style={{ color: 'var(--text-tertiary)', fontSize: 14, margin: 0 }}>No workouts logged yet</p>
            </div>
          ) : (
            <div className="forge-card-flush">
              {typedWorkouts.map(workout => (
                <div key={workout.id} className="forge-row" style={{ justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontWeight: 600, margin: 0, fontSize: 15 }}>{workout.name ?? 'Workout'}</p>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: 12, margin: '2px 0 0' }}>
                      {new Date(workout.started_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <ForgeIcon name="chevron-right" size={16} color="var(--text-tertiary)" />
                </div>
              ))}
            </div>
          )}
        </section>

      </main>
    </>
  )
}
