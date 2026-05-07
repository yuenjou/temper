import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import NavBar from '@/components/NavBar'
import ForgeIcon from '@/components/ForgeIcon'
import BodyweightChart from '@/app/measurements/BodyweightChart'
import ExerciseIllustration from '@/components/ExerciseIllustration'
import { calculateStreak } from '@/lib/heatmap'
import ActivityCalendar from './ActivityCalendar'

type PR = {
  id: string
  exercise_id: string
  reps: number
  weight: number
  weight_unit: string
  achieved_at: string
  exercises: { name: string } | null
}

type Measurement = { value: number; recorded_at: string }

function illustrationFor(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('bench') || (n.includes('press') && n.includes('chest'))) return 'bench-press'
  if (n.includes('squat')) return 'squat'
  if (n.includes('deadlift')) return 'deadlift'
  if (n.includes('row')) return 'row'
  if (n.includes('press') || n.includes('overhead') || n.includes('ohp')) return 'press'
  if (n.includes('curl')) return 'curl'
  return 'bench-press'
}

export default async function StatsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { count: workoutCount },
    { data: finishedWorkouts },
    { data: prs },
    { data: bodyweightData },
  ] = await Promise.all([
    supabase.from('workouts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('workouts').select('id, finished_at').eq('user_id', user.id).not('finished_at', 'is', null).order('finished_at', { ascending: false }),
    supabase.from('personal_records').select('id, exercise_id, reps, weight, weight_unit, achieved_at, exercises(name)').eq('user_id', user.id).order('achieved_at', { ascending: false }).limit(10),
    supabase.from('measurements').select('value, recorded_at').eq('user_id', user.id).eq('type', 'bodyweight').order('recorded_at', { ascending: true }),
  ])

  const finishedList = (finishedWorkouts ?? []) as { id: string; finished_at: string }[]
  const finishedAts = finishedList.map(w => w.finished_at)
  const streak = calculateStreak(finishedAts)
  const typedPrs = (prs ?? []) as unknown as PR[]
  const bwEntries = (bodyweightData ?? []) as Measurement[]

  const recentIds = finishedList.slice(0, 20).map(w => w.id)
  const muscleGroups: { name: string; pct: number }[] = []
  if (recentIds.length > 0) {
    const { data: setRows } = await supabase
      .from('sets')
      .select('exercises(muscle_group)')
      .in('workout_id', recentIds)

    const counts: Record<string, number> = {}
    for (const row of setRows ?? []) {
      const mg = (row.exercises as unknown as { muscle_group: string } | null)?.muscle_group?.trim()
      if (!mg) continue
      counts[mg] = (counts[mg] ?? 0) + 1
    }
    const total = Object.values(counts).reduce((a, b) => a + b, 0)
    if (total > 0) {
      Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([name, count]) => muscleGroups.push({ name, pct: count / total }))
    }
  }

  return (
    <>
      <NavBar />
      <main className="forge-main" style={{ minHeight: '100vh', paddingBottom: 120 }}>

        {/* Header */}
        <section style={{ padding: '20px 24px 20px' }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0 }}>Stats</h1>
        </section>

        {/* Stats Grid */}
        <section style={{ padding: '0 20px 20px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          <div className="forge-card" style={{ padding: 14, textAlign: 'center' }}>
            <p style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>{workoutCount ?? 0}</p>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '4px 0 0' }}>Workouts</p>
          </div>
          <div className="forge-card" style={{ padding: 14, textAlign: 'center' }}>
            <p style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>{streak}</p>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '4px 0 0' }}>Streak</p>
          </div>
        </section>

        {/* Activity Calendar */}
        <section style={{ padding: '0 20px 20px' }}>
          <p className="forge-eyebrow" style={{ marginBottom: 12 }}>Activity</p>
          <ActivityCalendar />
        </section>

        {/* Bodyweight Chart */}
        <section style={{ padding: '0 20px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p className="forge-eyebrow">Bodyweight</p>
            <Link href="/measurements" style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}>All →</Link>
          </div>
          {bwEntries.length >= 2 ? (
            <div className="forge-card">
              <BodyweightChart entries={bwEntries} />
            </div>
          ) : (
            <div className="forge-card" style={{ textAlign: 'center', padding: '24px 20px' }}>
              <ForgeIcon name="trend-up" size={32} color="var(--text-tertiary)" />
              <p style={{ color: 'var(--text-tertiary)', fontSize: 14, margin: '10px 0 0' }}>Log at least 2 bodyweight entries to see your trend</p>
              <Link href="/measurements" style={{ display: 'inline-flex', marginTop: 12, fontSize: 13, fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}>
                Log measurement →
              </Link>
            </div>
          )}
        </section>

        {/* Personal Records */}
        <section style={{ padding: '0 20px 20px' }}>
          <p className="forge-eyebrow" style={{ marginBottom: 12 }}>Personal Records</p>
          {typedPrs.length === 0 ? (
            <div className="forge-card" style={{ textAlign: 'center', padding: '32px 20px' }}>
              <ForgeIcon name="trophy" size={36} color="var(--text-tertiary)" />
              <p style={{ color: 'var(--text-secondary)', marginTop: 12, marginBottom: 0 }}>No personal records yet</p>
              <p style={{ color: 'var(--text-tertiary)', fontSize: 14, margin: '4px 0 0' }}>Log sets during workouts to track PRs</p>
            </div>
          ) : (
            <div className="forge-card-flush">
              {typedPrs.map(pr => {
                const exName = pr.exercises?.name ?? 'Unknown'
                return (
                  <div key={pr.id} className="forge-row" style={{ justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <ExerciseIllustration name={illustrationFor(exName)} size={44} />
                      <div>
                        <p style={{ fontWeight: 600, margin: 0, fontSize: 15 }}>{exName}</p>
                        <p style={{ color: 'var(--text-tertiary)', fontSize: 12, margin: '2px 0 0' }}>{pr.reps} rep{pr.reps !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: 700, margin: 0, fontSize: 15 }}>
                        {pr.weight} <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>{pr.weight_unit}</span>
                      </p>
                      <p style={{ color: 'var(--text-tertiary)', fontSize: 11, margin: '2px 0 0' }}>
                        {new Date(pr.achieved_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Muscle Distribution */}
        <section style={{ padding: '0 20px 20px' }}>
          <div className="forge-card">
            <p className="forge-eyebrow" style={{ marginBottom: 16 }}>Muscle Distribution</p>
            {muscleGroups.length === 0 ? (
              <p style={{ color: 'var(--text-tertiary)', fontSize: 14, textAlign: 'center', padding: '12px 0 4px' }}>
                Complete workouts to see your muscle distribution
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {muscleGroups.map(({ name, pct }) => (
                  <div key={name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>{name}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-tertiary)' }}>{Math.round(pct * 100)}%</span>
                    </div>
                    <div style={{ height: 4, background: 'var(--surface-2)', borderRadius: 999 }}>
                      <div style={{
                        height: '100%', borderRadius: 999,
                        background: 'var(--accent)',
                        width: `${pct * 100}%`,
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Strength Progress - coming soon */}
        <section style={{ padding: '0 20px 20px' }}>
          <p className="forge-eyebrow" style={{ marginBottom: 12 }}>Strength Progress</p>
          <div className="forge-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ForgeIcon name="chart" size={18} color="var(--text-tertiary)" />
              <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-secondary)' }}>Per-exercise progress charts</span>
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
              background: 'var(--surface-2)', color: 'var(--text-tertiary)',
              padding: '3px 8px', borderRadius: 'var(--r-pill)',
            }}>Coming Soon</span>
          </div>
        </section>

        {/* Recovery Trends - coming soon */}
        <section style={{ padding: '0 20px 20px' }}>
          <p className="forge-eyebrow" style={{ marginBottom: 12 }}>Recovery</p>
          <div className="forge-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ForgeIcon name="heart" size={18} color="var(--text-tertiary)" />
              <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-secondary)' }}>Recovery Trends</span>
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
              background: 'var(--surface-2)', color: 'var(--text-tertiary)',
              padding: '3px 8px', borderRadius: 'var(--r-pill)',
            }}>Coming Soon</span>
          </div>
        </section>

      </main>
    </>
  )
}
