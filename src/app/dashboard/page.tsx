import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import NavBar from '@/components/NavBar'
import ProgressRing from '@/components/ProgressRing'
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

type Workout = {
  id: string
  name: string | null
  started_at: string
  finished_at: string | null
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

function getWeekData(finishedAts: string[]): { done: number; days: boolean[] } {
  const now = new Date()
  // Monday-based week
  const dow = now.getUTCDay() // 0=Sun
  const monday = new Date(now)
  monday.setUTCDate(now.getUTCDate() - ((dow + 6) % 7))
  monday.setUTCHours(0, 0, 0, 0)

  const days = [false, false, false, false, false, false, false] // Mon-Sun
  for (const fa of finishedAts) {
    const d = new Date(fa)
    if (d >= monday) {
      const offset = (d.getUTCDay() + 6) % 7
      if (offset < 7) days[offset] = true
    }
  }
  return { done: days.filter(Boolean).length, days }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: workouts }, { data: prs }, { data: finishedWorkouts }] = await Promise.all([
    supabase
      .from('workouts')
      .select('id, name, started_at, finished_at')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(10),
    supabase
      .from('personal_records')
      .select('id, exercise_id, reps, weight, weight_unit, achieved_at, exercises(name)')
      .eq('user_id', user.id)
      .order('achieved_at', { ascending: false })
      .limit(5),
    supabase
      .from('workouts')
      .select('finished_at')
      .eq('user_id', user.id)
      .not('finished_at', 'is', null)
      .order('finished_at', { ascending: false }),
  ])

  const finishedAts = (finishedWorkouts ?? []).map(w => w.finished_at as string)
  const streak = calculateStreak(finishedAts)
  const weeklyTarget = 4
  const { done: weeklyDone, days: weekDays } = getWeekData(finishedAts)

  const now = new Date()
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const todayLabel = `${dayNames[now.getDay()].toUpperCase()}, ${monthNames[now.getMonth()].toUpperCase()} ${now.getDate()}`

  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning,' : hour < 17 ? 'Good afternoon,' : 'Good evening,'
  const emailPrefix = user.email?.split('@')[0] ?? 'Athlete'

  const typedPrs = (prs ?? []) as unknown as PR[]
  const typedWorkouts = (workouts ?? []) as Workout[]

  return (
    <>
      <NavBar />
      <main style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 96, maxWidth: 440, margin: '0 auto' }}>

        {/* Header */}
        <section style={{ padding: '8px 24px 24px' }}>
          <p className="forge-eyebrow" style={{ marginBottom: 6 }}>{todayLabel}</p>
          <h1 style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.15, margin: 0 }}>
            {greeting}<br />
            <span style={{ color: 'var(--text-secondary)' }}>{emailPrefix}</span>
          </h1>
        </section>

        {/* Weekly Summary */}
        <section style={{ padding: '0 20px 20px' }}>
          <div className="forge-card" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <ProgressRing value={weeklyDone / weeklyTarget} size={92} stroke={9} />
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{weeklyDone}</span>
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 500 }}>/{weeklyTarget}</span>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="forge-eyebrow" style={{ marginBottom: 6 }}>This week</p>
              <p style={{ fontSize: 17, fontWeight: 600, margin: '0 0 12px' }}>
                {weeklyDone} workout{weeklyDone !== 1 ? 's' : ''} done
              </p>
              <div style={{ display: 'flex', gap: 6 }}>
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: '50%',
                      background: weekDays[i] ? 'var(--accent)' : 'var(--surface-2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {weekDays[i] && (
                        <ForgeIcon name="check" size={12} color="#fff" strokeWidth={2.5} />
                      )}
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.02em' }}>{d}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Quick Stats */}
        <section style={{ padding: '0 20px 20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {/* Streak */}
          <div className="forge-card" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ForgeIcon name="flame" size={16} color="var(--accent)" />
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Streak</span>
            </div>
            <div>
              <span style={{ fontSize: 28, fontWeight: 700, lineHeight: 1 }}>{streak}</span>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginLeft: 3 }}>days</span>
            </div>
          </div>
          {/* PRs */}
          <div className="forge-card" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ForgeIcon name="trophy" size={16} color="var(--text-secondary)" />
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>PRs</span>
            </div>
            <div>
              <span style={{ fontSize: 28, fontWeight: 700, lineHeight: 1 }}>{typedPrs.length}</span>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginLeft: 3 }}>total</span>
            </div>
          </div>
          {/* Workouts */}
          <div className="forge-card" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ForgeIcon name="clock" size={16} color="var(--text-secondary)" />
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total</span>
            </div>
            <div>
              <span style={{ fontSize: 28, fontWeight: 700, lineHeight: 1 }}>{typedWorkouts.length}</span>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginLeft: 3 }}>sessions</span>
            </div>
          </div>
        </section>

        {/* Recent Workouts */}
        <section style={{ padding: '0 20px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p className="forge-eyebrow">Recent Workouts</p>
            <Link href="/workout/new" style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}>
              + Start
            </Link>
          </div>
          {typedWorkouts.length === 0 ? (
            <div className="forge-card" style={{ textAlign: 'center', padding: '32px 20px' }}>
              <ForgeIcon name="dumbbell" size={36} color="var(--text-tertiary)" />
              <p style={{ color: 'var(--text-secondary)', marginTop: 12, marginBottom: 0 }}>No workouts yet</p>
              <p style={{ color: 'var(--text-tertiary)', fontSize: 14, margin: '4px 0 0' }}>Start your first session!</p>
            </div>
          ) : (
            <div className="forge-card-flush">
              {typedWorkouts.map(workout => (
                <div key={workout.id} className="forge-row" style={{ justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontWeight: 600, margin: 0, fontSize: 15 }}>{workout.name ?? 'Workout'}</p>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: 12, margin: '2px 0 0' }}>
                      {new Date(workout.started_at).toLocaleDateString(undefined, {
                        weekday: 'short', month: 'short', day: 'numeric',
                      })}
                    </p>
                  </div>
                  <ForgeIcon name="chevron-right" size={16} color="var(--text-tertiary)" />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent PRs */}
        <section style={{ padding: '0 20px 20px' }}>
          <p className="forge-eyebrow" style={{ marginBottom: 12 }}>Personal Records</p>
          {typedPrs.length === 0 ? (
            <div className="forge-card" style={{ textAlign: 'center', padding: '32px 20px' }}>
              <ForgeIcon name="trophy" size={36} color="var(--text-tertiary)" />
              <p style={{ color: 'var(--text-secondary)', marginTop: 12, marginBottom: 0 }}>No PRs yet</p>
              <p style={{ color: 'var(--text-tertiary)', fontSize: 14, margin: '4px 0 0' }}>Log sets to track personal records</p>
            </div>
          ) : (
            <div className="forge-card-flush">
              {typedPrs.map(pr => (
                <div key={pr.id} className="forge-row" style={{ justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontWeight: 600, margin: 0, fontSize: 15 }}>{pr.exercises?.name ?? 'Unknown exercise'}</p>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: 12, margin: '2px 0 0' }}>
                      {pr.reps} rep{pr.reps !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: 700, margin: 0, color: '#ffd60a', fontSize: 15 }}>
                      {pr.weight} <span style={{ fontSize: 12, fontWeight: 500 }}>{pr.weight_unit}</span>
                    </p>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: 11, margin: '2px 0 0' }}>
                      {new Date(pr.achieved_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* AI Coach Hint */}
        <section style={{ padding: '0 20px 20px' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(255,59,48,0.08) 0%, var(--surface-1) 60%)',
            borderRadius: 'var(--r-lg)',
            border: '0.5px solid rgba(255,59,48,0.18)',
            padding: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <ForgeIcon name="bolt" size={18} color="var(--accent)" />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Coach suggests</span>
            </div>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, color: 'var(--text-secondary)' }}>
              {streak > 2
                ? `${streak}-day streak! Consider a rest day to maximize recovery and muscle growth.`
                : weeklyDone >= 3
                ? 'Great consistency this week. Push intensity — add 2.5 kg to your main lifts.'
                : 'Aim for 4 workouts this week. Consistency beats intensity every time.'}
            </p>
          </div>
        </section>

        {/* Start Workout CTA */}
        <section style={{ padding: '0 20px' }}>
          <Link href="/workout/new" className="forge-btn-primary" style={{ textDecoration: 'none' }}>
            <ForgeIcon name="play" size={18} color="#fff" />
            Start Workout
          </Link>
        </section>

      </main>
    </>
  )
}
