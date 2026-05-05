import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import MeasurementForm from './MeasurementForm'
import NavBar from '@/components/NavBar'

type Measurement = {
  id: string
  type: string
  value: number
  unit: string
  recorded_at: string
}

const TYPE_LABELS: Record<string, string> = {
  bodyweight: 'Bodyweight',
  body_fat: 'Body Fat',
  waist: 'Waist',
  chest: 'Chest',
  arms: 'Arms',
}

const TYPES_ORDER = ['bodyweight', 'body_fat', 'waist', 'chest', 'arms']

export default async function MeasurementsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('measurements')
    .select('id, type, value, unit, recorded_at')
    .eq('user_id', user.id)
    .order('recorded_at', { ascending: false })
    .order('created_at', { ascending: false })

  const grouped: Record<string, Measurement[]> = {}
  for (const m of (data ?? []) as Measurement[]) {
    if (!grouped[m.type]) grouped[m.type] = []
    grouped[m.type].push(m)
  }

  const types = TYPES_ORDER.filter(t => grouped[t])

  return (
    <>
      <NavBar />
      <main style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 96, maxWidth: 440, margin: '0 auto' }}>

        {/* Header */}
        <section style={{ padding: '20px 24px 24px' }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0 }}>Measurements</h1>
        </section>

        {/* Form */}
        <section style={{ padding: '0 20px 20px' }}>
          <MeasurementForm />
        </section>

        {/* History */}
        <section style={{ padding: '0 20px 20px' }}>
          {types.length === 0 ? (
            <div style={{
              background: 'var(--surface-1)', borderRadius: 'var(--r-lg)',
              boxShadow: 'var(--shadow-card)', padding: '32px 20px', textAlign: 'center',
            }}>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No measurements yet</p>
              <p style={{ color: 'var(--text-tertiary)', fontSize: 14, margin: '4px 0 0' }}>Log your first one above!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {types.map(type => {
                const entries = grouped[type]
                const latest = entries[0]
                const prior = entries.slice(1)
                return (
                  <div key={type} style={{
                    background: 'var(--surface-1)', borderRadius: 'var(--r-lg)',
                    boxShadow: 'var(--shadow-card)', padding: 20,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                      <h2 style={{ fontWeight: 600, fontSize: 16, margin: 0 }}>{TYPE_LABELS[type] ?? type}</h2>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 28, fontWeight: 700 }}>{latest.value}</span>
                        <span style={{ color: 'var(--text-tertiary)', marginLeft: 4, fontSize: 14 }}>{latest.unit}</span>
                      </div>
                    </div>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: 12, margin: '0 0 12px' }}>
                      {new Date(latest.recorded_at).toLocaleDateString(undefined, {
                        weekday: 'short', month: 'short', day: 'numeric',
                      })}
                    </p>
                    {prior.length > 0 && (
                      <details style={{ fontSize: 14 }}>
                        <summary style={{ color: 'var(--text-tertiary)', cursor: 'pointer', userSelect: 'none', listStyle: 'none' }}>
                          {prior.length} prior {prior.length === 1 ? 'entry' : 'entries'}
                        </summary>
                        <div style={{ marginTop: 10, borderTop: '0.5px solid var(--hairline)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {prior.map(m => (
                            <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                              <span>
                                {new Date(m.recorded_at).toLocaleDateString(undefined, {
                                  month: 'short', day: 'numeric',
                                })}
                              </span>
                              <span>{m.value} {m.unit}</span>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
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
