'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function logMeasurement(
  type: string,
  value: number,
  unit: string,
  recordedAt: string,
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('measurements')
    .insert({ user_id: user.id, type, value, unit, recorded_at: recordedAt })

  if (error) throw error
  revalidatePath('/measurements')
}

export async function deleteMeasurement(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: entry } = await supabase
    .from('measurements')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!entry) throw new Error('Unauthorized')

  const { error } = await supabase.from('measurements').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/measurements')
}
