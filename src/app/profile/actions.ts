'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function upsertProfile(data: {
  height: number | null
  height_unit: string
  date_of_birth: string | null
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await supabase.from('user_profiles').upsert({
    user_id: user.id,
    height: data.height,
    height_unit: data.height_unit,
    date_of_birth: data.date_of_birth,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })

  revalidatePath('/profile')
}

export async function upsertDailyTargets(data: {
  calories: number
  protein: number
  carbs: number
  fat: number
  goal_type: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await supabase.from('daily_targets').upsert({
    user_id: user.id,
    calories: data.calories,
    protein: data.protein,
    carbs: data.carbs,
    fat: data.fat,
    goal_type: data.goal_type,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })

  revalidatePath('/profile')
  revalidatePath('/food')
}
