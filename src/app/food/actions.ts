'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks'

type FoodEntryInput = {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  meal_type: MealType
  logged_at?: string
}

export async function addFoodEntry(data: FoodEntryInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('food_entries').insert({
    user_id: user.id,
    name: data.name,
    calories: data.calories,
    protein: data.protein,
    carbs: data.carbs,
    fat: data.fat,
    meal_type: data.meal_type,
    logged_at: data.logged_at ?? new Date().toISOString(),
  })

  if (error) throw error
  revalidatePath('/food')
}

export async function updateFoodEntry(id: string, data: Required<FoodEntryInput>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('food_entries')
    .update({
      name: data.name,
      calories: data.calories,
      protein: data.protein,
      carbs: data.carbs,
      fat: data.fat,
      meal_type: data.meal_type,
      logged_at: data.logged_at,
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw error
  revalidatePath('/food')
}

export async function deleteFoodEntry(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('food_entries')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw error
  revalidatePath('/food')
}

export async function saveFavourite(data: Omit<FoodEntryInput, 'meal_type'>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('food_favourites').insert({
    user_id: user.id,
    name: data.name,
    calories: data.calories,
    protein: data.protein,
    carbs: data.carbs,
    fat: data.fat,
  })

  if (error) throw error
  revalidatePath('/food')
}

export async function deleteFavourite(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('food_favourites')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw error
  revalidatePath('/food')
}
