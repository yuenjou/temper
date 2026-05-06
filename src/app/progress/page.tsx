import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import NavBar from '@/components/NavBar'
import ExerciseIllustration from '@/components/ExerciseIllustration'
import ForgeIcon from '@/components/ForgeIcon'

type PR = {
  id: string
  exercise_id: string
  reps: number
  weight: number
  weight_unit: string
  achieved_at: string
  exercises: { name: string } | null
}

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

function buildHeatmap(finishedAts: string[]): number[] {
  const dateCounts: Record<string, number> = {}
  for (const fa of finishedAts) {
    const d = fa.slice(0, 10)
    dateCounts[d] = (dateCounts[d] || 0) + 1
  }
  const now = new Date()
  const cells: number[] = []
  // Go back 12 weeks from today, week starts Monday
  const dow = now.getUTCDay()
  const end = new Date(now)
  end.setUTCDate(end.getUTCDate() - ((dow + 6) % 7) + 6) // end of current week (Sunday)
  end.setUTCHours(0, 0, 0, 0)
  const start = new Date(end)
  start.setUTCDate(start.getUTCDate() - 12 * 7 + 1)

  const cur = new Date(start)
  while (cur <= end) {
    const ds = cur.toISOString().slice(0, 10)
    cells.push(Math.min(dateCounts[ds] || 0, 3))
    cur.setUTCDate(cur.getUTCDate() + 1)
  }
  return cells
}

function heatColor(v: number): string {
  if (v === 0) return 'var(--surface-2)'
  if (v === 1) return 'rgba(255, 59, 48, 0.35)'
  if (v === 2) return 'rgba(255, 59, 48, 0.65)'
  return 'var(--accent)'
}

// Static muscle distribution data for now
const MUSCLE_GROUPS = [
  { name: 'Chest', pct: 0.28 },
  { name: 'Back', pct: 0.22 },
  { name: 'Legs', pct: 0.20 },
  { name: 'Shoulders', pct: 0.15 },
  { name: 'Arms', pct: 0.15 },
]

export default async function ProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: prs }, { data: workoutDates }] = await Promise.all([
    supabase
      .from('personal_records')
      .select('id, exercise_id, reps, weight, weight_unit, achieved_at, exercises(name)')
      .eq('user_id', user.id)
      .order('achieved_at', { ascending: false })
      .limit(10),
    supabase
      .from('workouts')
      .select('started_at, finished_at')
      .eq('user_id', user.id)
      .not('finished_at', 'is', null)
      .order('started_at', { ascending: true }),
  ])

  const typedPrs = (prs ?? []) as unknown as PR[]
  const finishedAts = (workoutDates ?? []).map(w => w.finished_at as string)
  const heatCells = buildHeatmap(finishedAts)

  return (
    <>
      <NavBar />
      <main className="forge-main" style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 120 }}>

        {/* Header */}
        <section style={{ padding: '20px 24px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0 }}>Progress</h1>
          <button className="forge-icon-btn" aria-label="Calendar">
            <ForgeIcon name="calendar" size={18} />
          </button>
        </section>

        {/* Personal Records */}
        <section style={{ padding: '0 20px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p className="forge-eyebrow">Personal Records</p>
            <Link href="/measurements" style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}>
              All →
            </Link>
          </div>
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
                        <p style={{ color: 'var(--text-tertiary)', fontSize: 12, margin: '2px 0 0' }}>
                          {pr.reps} rep{pr.reps !== 1 ? 's' : ''}
                        </p>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {MUSCLE_GROUPS.map(({ name, pct }) => (
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
          </div>
        </section>

        {/* Activity Heatmap */}
        <section style={{ padding: '0 20px 20px' }}>
          <div className="forge-card">
            <p className="forge-eyebrow" style={{ marginBottom: 16 }}>Activity (12 weeks)</p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(12, 1fr)',
              gridTemplateRows: 'repeat(7, 1fr)',
              gap: 3,
              gridAutoFlow: 'column',
            }}>
              {heatCells.map((v, i) => (
                <div key={i} style={{
                  width: '100%',
                  aspectRatio: '1',
                  borderRadius: 2,
                  background: heatColor(v),
                }} />
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginTop: 10 }}>
              <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>Less</span>
              {[0, 1, 2, 3].map(v => (
                <div key={v} style={{ width: 10, height: 10, borderRadius: 2, background: heatColor(v) }} />
              ))}
              <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>More</span>
            </div>
          </div>
        </section>

        {/* Measurements Link */}
        <section style={{ padding: '0 20px' }}>
          <Link href="/measurements" className="forge-btn-secondary" style={{ textDecoration: 'none' }}>
            <ForgeIcon name="ruler" size={18} />
            View Measurements
          </Link>
        </section>

      </main>
    </>
  )
}
