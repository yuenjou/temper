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
