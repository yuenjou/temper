import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import NavBar from '@/components/NavBar'
import ProgressRing from '@/components/ProgressRing'
import ForgeIcon from '@/components/ForgeIcon'

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
  const dow = now.getUTCDay()
  const monday = new Date(now)
  monday.setUTCDate(now.getUTCDate() - ((dow + 6) % 7))
  monday.setUTCHours(0, 0, 0, 0)
  const days = [false, false, false, false, false, false, false]
  for (const fa of finishedAts) {
    const d = new Date(fa)
    if (d >= monday) {
      const offset = (d.getUTCDay() + 6) % 7
      if (offset < 7) days[offset] = true
    }
  }
  return { done: days.filter(Boolean).length, days }
}

function ComingSoon({ label, icon }: { label: string; icon: string }) {
  return (
    <div className="forge-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <ForgeIcon name={icon} size={18} color="var(--text-tertiary)" />
        <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</span>
      </div>
      <span style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
        background: 'var(--surface-2)', color: 'var(--text-tertiary)',
        padding: '3px 8px', borderRadius: 'var(--r-pill)',
      }}>
        Coming Soon
      </span>
    </div>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: recentWorkouts }, { data: finishedWorkouts }] = await Promise.all([
    supabase
      .from('workouts')
      .select('id, name, started_at, finished_at')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
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
  const typedWorkouts = (recentWorkouts ?? []) as Workout[]

  const now = new Date()
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const todayLabel = `${dayNames[now.getDay()].toUpperCase()}, ${monthNames[now.getMonth()].toUpperCase()} ${now.getDate()}`
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning,' : hour < 17 ? 'Good afternoon,' : 'Good evening,'
  const emailPrefix = user.email?.split('@')[0] ?? 'Athlete'

  return (
    <>
      <NavBar />
      <main className="forge-main" style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 96 }}>

        {/* Header */}
        <section style={{ padding: '8px 24px 20px' }}>
          <p className="forge-eyebrow" style={{ marginBottom: 6 }}>{todayLabel}</p>
          <h1 style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.15, margin: 0 }}>
            {greeting}<br />
            <span style={{ color: 'var(--text-secondary)' }}>{emailPrefix}</span>
          </h1>
        </section>

        {/* Streak + Weekly ring row */}
        <section style={{ padding: '0 20px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {/* Streak */}
          <div className="forge-card" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ForgeIcon name="flame" size={16} color="var(--accent)" />
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Streak</span>
            </div>
            <div>
              <span style={{ fontSize: 36, fontWeight: 700, lineHeight: 1 }}>{streak}</span>
              <span style={{ fontSize: 13, color: 'var(--text-tertiary)', marginLeft: 4 }}>days</span>
            </div>
          </div>

          {/* Weekly ring */}
          <div className="forge-card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <ProgressRing value={weeklyDone / weeklyTarget} size={56} stroke={6} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 700, lineHeight: 1 }}>{weeklyDone}</span>
                <span style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>/{weeklyTarget}</span>
              </div>
            </div>
            <div>
              <p className="forge-eyebrow" style={{ marginBottom: 2 }}>This week</p>
              <div style={{ display: 'flex', gap: 4 }}>
                {['M','T','W','T','F','S','S'].map((_d, i) => (
                  <div key={i} style={{
                    width: 20, height: 20, borderRadius: '50%',
                    background: weekDays[i] ? 'var(--accent)' : 'var(--surface-2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {weekDays[i] && <ForgeIcon name="check" size={10} color="#fff" strokeWidth={2.5} />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Coming Soon placeholders */}
        <section style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ComingSoon label="Readiness Score" icon="heart" />
          <ComingSoon label="Today's Calories" icon="bolt" />
          <ComingSoon label="Workout of the Day" icon="dumbbell" />
        </section>

        {/* Quick Log Shortcuts */}
        <section style={{ padding: '0 20px 20px' }}>
          <p className="forge-eyebrow" style={{ marginBottom: 12 }}>Quick Log</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            <Link href="/food" style={{ textDecoration: 'none' }}>
              <div className="forge-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 12px' }}>
                <ForgeIcon name="apple" size={22} color="var(--accent)" />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Food</span>
              </div>
            </Link>
            <div className="forge-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 12px', opacity: 0.5 }}>
              <ForgeIcon name="clock" size={22} color="var(--text-tertiary)" />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Sleep</span>
            </div>
            <Link href="/workout/new" style={{ textDecoration: 'none' }}>
              <div className="forge-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 12px' }}>
                <ForgeIcon name="dumbbell" size={22} color="var(--accent)" />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Workout</span>
              </div>
            </Link>
          </div>
        </section>

        {/* AI Coach Nudge */}
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

        {/* Recent Workouts */}
        <section style={{ padding: '0 20px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p className="forge-eyebrow">Recent Workouts</p>
            <Link href="/workout/new" style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}>+ Start</Link>
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
