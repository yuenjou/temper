import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import NavBar from '@/components/NavBar'
import ForgeIcon from '@/components/ForgeIcon'
import ProfileCard from './ProfileCard'
import GoalsCard from './GoalsCard'
import { signOut } from './actions'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: profileData },
    { data: targetsData },
  ] = await Promise.all([
    supabase.from('user_profiles').select('display_name, height, height_unit, date_of_birth').eq('user_id', user.id).maybeSingle(),
    supabase.from('daily_targets').select('calories, protein, carbs, fat, goal_type').eq('user_id', user.id).maybeSingle(),
  ])

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
