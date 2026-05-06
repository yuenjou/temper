import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import NavBar from '@/components/NavBar'
import ForgeIcon from '@/components/ForgeIcon'

function ComingSoonCard({ label, icon, description }: { label: string; icon: string; description: string }) {
  return (
    <div className="forge-card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{
        width: 44, height: 44, borderRadius: 'var(--r-md)', flexShrink: 0,
        background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <ForgeIcon name={icon} size={20} color="var(--text-tertiary)" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 600, margin: 0, fontSize: 15 }}>{label}</p>
        <p style={{ color: 'var(--text-tertiary)', fontSize: 13, margin: '2px 0 0' }}>{description}</p>
      </div>
      <span style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
        background: 'var(--surface-2)', color: 'var(--text-tertiary)',
        padding: '3px 8px', borderRadius: 'var(--r-pill)', flexShrink: 0,
      }}>Soon</span>
    </div>
  )
}

function MealSection({ meal }: { meal: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>
        {meal}
      </p>
      <div className="forge-card" style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: 0.55 }}>
        <ForgeIcon name="plus" size={16} color="var(--text-tertiary)" />
        <span style={{ fontSize: 14, color: 'var(--text-tertiary)', fontWeight: 500 }}>Add food</span>
        <span style={{
          marginLeft: 'auto', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
          background: 'var(--surface-2)', color: 'var(--text-tertiary)',
          padding: '3px 8px', borderRadius: 'var(--r-pill)',
        }}>Soon</span>
      </div>
    </div>
  )
}

export default async function FoodPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <>
      <NavBar />
      <main className="forge-main" style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 96 }}>

        {/* Header */}
        <section style={{ padding: '20px 24px 20px' }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0 }}>Food</h1>
        </section>

        {/* Calories + Macro strip - coming soon */}
        <section style={{ padding: '0 20px 24px' }}>
          <div className="forge-card" style={{
            background: 'linear-gradient(135deg, rgba(255,59,48,0.06) 0%, var(--surface-1) 100%)',
            border: '0.5px solid rgba(255,59,48,0.15)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <p className="forge-eyebrow" style={{ margin: 0 }}>Today&apos;s Nutrition</p>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                background: 'var(--surface-2)', color: 'var(--text-tertiary)',
                padding: '3px 8px', borderRadius: 'var(--r-pill)',
              }}>Coming Soon</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {[
                { label: 'Calories', unit: 'kcal' },
                { label: 'Protein', unit: 'g' },
                { label: 'Carbs', unit: 'g' },
                { label: 'Fat', unit: 'g' },
              ].map(({ label, unit }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 22, fontWeight: 700, margin: 0, color: 'var(--text-tertiary)' }}>—</p>
                  <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {label}
                    <br /><span style={{ fontWeight: 400 }}>{unit}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Meals */}
        <section style={{ padding: '0 20px 24px' }}>
          <p className="forge-eyebrow" style={{ marginBottom: 16 }}>Meals</p>
          <MealSection meal="Breakfast" />
          <MealSection meal="Lunch" />
          <MealSection meal="Dinner" />
          <MealSection meal="Snacks" />
        </section>

        {/* Water Tracker */}
        <section style={{ padding: '0 20px 24px' }}>
          <ComingSoonCard
            label="Water Tracker"
            icon="water"
            description="Log daily hydration intake"
          />
        </section>

        {/* Add Food CTA - coming soon */}
        <section style={{ padding: '0 20px' }}>
          <button disabled style={{
            width: '100%', padding: '16px 20px',
            background: 'var(--surface-2)', color: 'var(--text-tertiary)',
            borderRadius: 'var(--r-pill)', fontSize: 16, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            opacity: 0.55, cursor: 'not-allowed',
          }}>
            <ForgeIcon name="plus" size={18} color="var(--text-tertiary)" />
            Add Food — Coming Soon
          </button>
        </section>

      </main>
    </>
  )
}
