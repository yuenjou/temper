import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import MeasurementForm from './MeasurementForm'
import MeasurementHistory from './MeasurementHistory'
import NavBar from '@/components/NavBar'

type Measurement = {
  id: string
  type: string
  value: number
  unit: string
  recorded_at: string
}

export default async function MeasurementsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('measurements')
    .select('id, type, value, unit, recorded_at')
    .eq('user_id', user.id)
    .order('recorded_at', { ascending: false })

  const grouped: Record<string, Measurement[]> = {}
  for (const m of (data ?? []) as Measurement[]) {
    if (!grouped[m.type]) grouped[m.type] = []
    grouped[m.type].push(m)
  }

  return (
    <>
      <NavBar />
      <main className="forge-main" style={{ minHeight: '100vh', paddingBottom: 120 }}>

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
          <MeasurementHistory grouped={grouped} />
        </section>

      </main>
    </>
  )
}
