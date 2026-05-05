import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import MeasurementForm from './MeasurementForm'

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

  const grouped: Record<string, Measurement[]> = {}
  for (const m of (data ?? []) as Measurement[]) {
    if (!grouped[m.type]) grouped[m.type] = []
    grouped[m.type].push(m)
  }

  const types = TYPES_ORDER.filter(t => grouped[t])

  return (
    <div className="min-h-screen bg-black text-white p-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Measurements</h1>
        <Link href="/dashboard" className="text-zinc-400 hover:text-white text-sm">
          ← Dashboard
        </Link>
      </div>

      <MeasurementForm />

      {types.length === 0 ? (
        <p className="text-zinc-400">No measurements yet. Log your first one above!</p>
      ) : (
        <div className="space-y-4">
          {types.map(type => {
            const entries = grouped[type]
            const latest = entries[0]
            const prior = entries.slice(1)
            return (
              <div key={type} className="border border-zinc-700 rounded-lg p-4">
                <div className="flex justify-between items-baseline mb-1">
                  <h2 className="font-semibold">{TYPE_LABELS[type] ?? type}</h2>
                  <div className="text-right">
                    <span className="text-2xl font-bold">{latest.value}</span>
                    <span className="text-zinc-400 ml-1 text-sm">{latest.unit}</span>
                  </div>
                </div>
                <p className="text-zinc-500 text-xs mb-3">
                  {new Date(latest.recorded_at).toLocaleDateString(undefined, {
                    weekday: 'short', month: 'short', day: 'numeric',
                  })}
                </p>
                {prior.length > 0 && (
                  <details className="text-sm">
                    <summary className="text-zinc-400 cursor-pointer hover:text-zinc-300 select-none">
                      {prior.length} prior {prior.length === 1 ? 'entry' : 'entries'}
                    </summary>
                    <div className="mt-2 space-y-1 border-t border-zinc-800 pt-2">
                      {prior.map(m => (
                        <div key={m.id} className="flex justify-between text-zinc-400">
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
    </div>
  )
}
