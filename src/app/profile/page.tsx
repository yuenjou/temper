import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import NavBar from '@/components/NavBar'
import ForgeIcon from '@/components/ForgeIcon'
import ProfileCard from './ProfileCard'
import GoalsCard from './GoalsCard'
import BodyweightChart from '@/app/measurements/BodyweightChart'
import ExerciseIllustration from '@/components/ExerciseIllustration'
import { signOut } from './actions'

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

function buildHeatmap(finishedAts: string[]): number[] {
  const dateCounts: Record<string, number> = {}
  for (const fa of finishedAts) {
    const d = fa.slice(0, 10)
    dateCounts[d] = (dateCounts[d] || 0) + 1
  }
  const now = new Date()
  const cells: number[] = []
  const dow = now.getUTCDay()
  const end = new Date(now)
  end.setUTCDate(end.getUTCDate() - ((dow + 6) % 7) + 6)
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

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { count: workoutCount },
    { data: finishedWorkouts },
    { data: profileData },
    { data: prs },
    { data: bodyweightData },
    { data: targetsData },
  ] = await Promise.all([
    supabase.from('workouts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('workouts').select('finished_at').eq('user_id', user.id).not('finished_at', 'is', null).order('finished_at', { ascending: false }),
    supabase.from('user_profiles').select('display_name, height, height_unit, date_of_birth').eq('user_id', user.id).maybeSingle(),
    supabase.from('personal_records').select('id, exercise_id, reps, weight, weight_unit, achieved_at, exercises(name)').eq('user_id', user.id).order('achieved_at', { ascending: false }).limit(8),
    supabase.from('measurements').select('value, recorded_at').eq('user_id', user.id).eq('type', 'bodyweight').order('recorded_at', { ascending: true }),
    supabase.from('daily_targets').select('calories, protein, carbs, fat, goal_type').eq('user_id', user.id).maybeSingle(),
  ])

  const finishedAts = (finishedWorkouts ?? []).map(w => w.finished_at as string)
  const streak = calculateStreak(finishedAts)
  const heatCells = buildHeatmap(finishedAts)
  const typedPrs = (prs ?? []) as unknown as PR[]
  const bwEntries = (bodyweightData ?? []) as Measurement[]

  const email = user.email ?? ''
  const emailPrefix = email.split('@')[0]

  return (
    <>
      <NavBar />
      <main className="forge-main" style={{ minHeight: '100vh', paddingBottom: 120 }}>

        {/* Header */}
        <section style={{ padding: '20px 24px 20px' }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0 }}>Profile</h1>
        </section>

        {/* Profile Card */}
        <section style={{ padding: '0 20px 20px' }}>
          <ProfileCard
            profile={profileData ?? null}
            emailPrefix={emailPrefix}
            email={email}
          />
        </section>

        {/* Goals */}
        <section style={{ padding: '0 20px 20px' }}>
          <p className="forge-eyebrow" style={{ marginBottom: 12 }}>Goals</p>
          <GoalsCard goals={targetsData ?? null} />
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

        {/* Personal Records */}
        <section style={{ padding: '0 20px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p className="forge-eyebrow">Personal Records</p>
            <Link href="/progress" style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}>All →</Link>
          </div>
          {typedPrs.length === 0 ? (
            <div className="forge-card" style={{ textAlign: 'center', padding: '24px 20px' }}>
              <ForgeIcon name="trophy" size={32} color="var(--text-tertiary)" />
              <p style={{ color: 'var(--text-tertiary)', fontSize: 14, margin: '10px 0 0' }}>No personal records yet</p>
            </div>
          ) : (
            <div className="forge-card-flush">
              {typedPrs.map(pr => {
                const exName = pr.exercises?.name ?? 'Unknown'
                return (
                  <div key={pr.id} className="forge-row" style={{ justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <ExerciseIllustration name={illustrationFor(exName)} size={40} />
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

        {/* Workout Heatmap */}
        <section style={{ padding: '0 20px 20px' }}>
          <p className="forge-eyebrow" style={{ marginBottom: 12 }}>Activity (12 weeks)</p>
          <div className="forge-card">
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(12, 1fr)',
              gridTemplateRows: 'repeat(7, 1fr)',
              gap: 3,
              gridAutoFlow: 'column',
            }}>
              {heatCells.map((v, i) => (
                <div key={i} style={{ width: '100%', aspectRatio: '1', borderRadius: 2, background: heatColor(v) }} />
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

        {/* Settings */}
        <section style={{ padding: '0 20px 20px' }}>
          <p className="forge-eyebrow" style={{ marginBottom: 12 }}>Settings</p>
          <div className="forge-card-flush">
            <Link href="/measurements" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="forge-row" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(10, 132, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ForgeIcon name="ruler" size={16} color="var(--blue)" />
                  </div>
                  <span style={{ fontWeight: 500, fontSize: 15 }}>Measurements</span>
                </div>
                <ForgeIcon name="chevron-right" size={16} color="var(--text-tertiary)" />
              </div>
            </Link>
            <div className="forge-row" style={{ justifyContent: 'space-between', opacity: 0.6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255, 159, 10, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ForgeIcon name="bolt" size={16} color="var(--orange)" />
                </div>
                <span style={{ fontWeight: 500, fontSize: 15 }}>Notifications</span>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Soon</span>
            </div>
          </div>
        </section>

        {/* Sign Out */}
        <section style={{ padding: '0 20px 20px' }}>
          <form action={signOut}>
            <button type="submit" style={{
              width: '100%', padding: '14px 20px',
              background: 'var(--surface-1)', color: 'var(--accent)',
              border: '0.5px solid rgba(255,59,48,0.25)',
              borderRadius: 'var(--r-pill)', fontSize: 16, fontWeight: 600,
              cursor: 'pointer',
            }}>
              Sign Out
            </button>
          </form>
        </section>

      </main>
    </>
  )
}
