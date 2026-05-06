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

export default async function WorkoutNewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rawRoutines } = await supabase
    .from('routines')
    .select('id, name, routine_exercises(order_index, exercises(id, name))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const routines = ((rawRoutines ?? []) as unknown as Routine[]).map(r => ({
    ...r,
    routine_exercises: [...r.routine_exercises].sort((a, b) => a.order_index - b.order_index),
  }))

  return (
    <>
      <NavBar />
      <main className="forge-main" style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 96 }}>

        {/* Header */}
        <section style={{ padding: '20px 24px 24px' }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0 }}>Workout</h1>
        </section>

        {/* Section 1: Start Empty Workout */}
        <section style={{ padding: '0 20px 36px' }}>
          <form action={createAndStartWorkout}>
            <button type="submit" className="forge-btn-primary">
              <ForgeIcon name="play" size={20} color="#fff" />
              Start Empty Workout
            </button>
          </form>
        </section>

        {/* Section 2: My Routines */}
        <section style={{ padding: '0 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <p className="forge-eyebrow">My Routines</p>
            <Link
              href="/routine/new"
              style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}
            >
              + New Routine
            </Link>
          </div>

          {routines.length === 0 ? (
            <div className="forge-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <ForgeIcon name="dumbbell" size={40} color="var(--text-tertiary)" />
              <p style={{ color: 'var(--text-secondary)', margin: '14px 0 4px', fontWeight: 500 }}>No routines yet</p>
              <p style={{ color: 'var(--text-tertiary)', fontSize: 14, margin: 0 }}>
                Save a routine to start workouts faster
              </p>
              <Link
                href="/routine/new"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  marginTop: 18, padding: '10px 20px',
                  background: 'var(--accent-soft)', color: 'var(--accent)',
                  borderRadius: 'var(--r-pill)', fontSize: 14, fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
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
                        <p style={{ fontWeight: 700, fontSize: 17, margin: 0, letterSpacing: '-0.01em' }}>
                          {routine.name}
                        </p>
                        {preview && (
                          <p style={{
                            color: 'var(--text-tertiary)', fontSize: 13, margin: '4px 0 0',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {preview}
                          </p>
                        )}
                        <p style={{ color: 'var(--text-tertiary)', fontSize: 12, margin: '4px 0 0' }}>
                          {exNames.length} exercise{exNames.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <form action={startRoutineWorkout.bind(null, routine.id)}>
                        <button
                          type="submit"
                          style={{
                            padding: '9px 20px',
                            background: 'var(--accent)', color: '#fff',
                            borderRadius: 'var(--r-pill)', fontSize: 14, fontWeight: 600,
                            flexShrink: 0, transition: 'background 0.15s ease',
                            cursor: 'pointer',
                          }}
                        >
                          Start
                        </button>
                      </form>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

      </main>
    </>
  )
}
