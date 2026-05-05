import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import NavBar from '@/components/NavBar'
import ForgeIcon from '@/components/ForgeIcon'

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
    { count: prCount },
    { count: measurementCount },
    { data: finishedWorkouts },
  ] = await Promise.all([
    supabase
      .from('workouts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('personal_records')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('measurements')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('workouts')
      .select('finished_at')
      .eq('user_id', user.id)
      .not('finished_at', 'is', null)
      .order('finished_at', { ascending: false }),
  ])

  const finishedAts = (finishedWorkouts ?? []).map(w => w.finished_at as string)
  const streak = calculateStreak(finishedAts)

  const email = user.email ?? ''
  const emailPrefix = email.split('@')[0]
  const initials = emailPrefix.charAt(0).toUpperCase()

  return (
    <>
      <NavBar />
      <main className="forge-main" style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 96 }}>

        {/* Header */}
        <section style={{ padding: '20px 24px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0 }}>Profile</h1>
          <button className="forge-icon-btn" aria-label="Settings">
            <ForgeIcon name="settings" size={18} />
          </button>
        </section>

        {/* Profile Card */}
        <section style={{ padding: '0 20px 20px' }}>
          <div className="forge-card" style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            {/* Avatar */}
            <div style={{
              width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, var(--accent) 0%, #ff8a80 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 700, color: '#fff',
            }}>
              {initials}
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 18, margin: 0 }}>{emailPrefix}</p>
              <p style={{ color: 'var(--text-tertiary)', fontSize: 13, margin: '3px 0 0' }}>{email}</p>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                marginTop: 8, padding: '3px 10px',
                background: 'var(--accent-soft)', borderRadius: 'var(--r-pill)',
              }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.02em' }}>Member</span>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section style={{ padding: '0 20px 20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          <div className="forge-card" style={{ padding: 14, textAlign: 'center' }}>
            <p style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>{workoutCount ?? 0}</p>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '4px 0 0' }}>Workouts</p>
          </div>
          <div className="forge-card" style={{ padding: 14, textAlign: 'center' }}>
            <p style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>{prCount ?? 0}</p>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '4px 0 0' }}>PRs</p>
          </div>
          <div className="forge-card" style={{ padding: 14, textAlign: 'center' }}>
            <p style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>{streak}</p>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '4px 0 0' }}>Streak</p>
          </div>
        </section>

        {/* Measurements count card */}
        <section style={{ padding: '0 20px 20px' }}>
          <div className="forge-card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 'var(--r-md)',
              background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ForgeIcon name="ruler" size={18} color="var(--text-secondary)" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, margin: 0 }}>Measurements</p>
              <p style={{ color: 'var(--text-tertiary)', fontSize: 13, margin: '2px 0 0' }}>
                {measurementCount ?? 0} {(measurementCount ?? 0) === 1 ? 'entry' : 'entries'} logged
              </p>
            </div>
            <ForgeIcon name="chevron-right" size={16} color="var(--text-tertiary)" />
          </div>
        </section>

        {/* Settings List */}
        <section style={{ padding: '0 20px 20px' }}>
          <p className="forge-eyebrow" style={{ marginBottom: 12 }}>Settings</p>
          <div className="forge-card-flush">
            <Link href="/measurements" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="forge-row" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: 'rgba(10, 132, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <ForgeIcon name="ruler" size={16} color="var(--blue)" />
                  </div>
                  <span style={{ fontWeight: 500, fontSize: 15 }}>Measurements</span>
                </div>
                <ForgeIcon name="chevron-right" size={16} color="var(--text-tertiary)" />
              </div>
            </Link>
            <div className="forge-row" style={{ justifyContent: 'space-between', opacity: 0.6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'rgba(48, 209, 88, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <ForgeIcon name="trend-up" size={16} color="var(--green)" />
                </div>
                <span style={{ fontWeight: 500, fontSize: 15 }}>Goals &amp; Targets</span>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Soon</span>
            </div>
            <div className="forge-row" style={{ justifyContent: 'space-between', opacity: 0.6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'rgba(255, 159, 10, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <ForgeIcon name="bolt" size={16} color="var(--orange)" />
                </div>
                <span style={{ fontWeight: 500, fontSize: 15 }}>Notifications</span>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Soon</span>
            </div>
          </div>
        </section>

      </main>
    </>
  )
}
