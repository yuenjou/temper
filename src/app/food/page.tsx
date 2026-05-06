import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import NavBar from '@/components/NavBar'
import FoodClient from './FoodClient'
import type { FoodEntry, FoodFavourite, DailyTargets, FoodRecent } from './FoodClient'

export default async function FoodPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const todayStr = new Date().toISOString().slice(0, 10)
  const dayStart = `${todayStr}T00:00:00.000Z`
  const dayEnd = `${todayStr}T23:59:59.999Z`

  const [
    { data: entriesRaw },
    { data: favouritesRaw },
    { data: targetsRaw },
    { data: recentsRaw },
  ] = await Promise.all([
    supabase
      .from('food_entries')
      .select('id, name, calories, protein, carbs, fat, meal_type, logged_at')
      .eq('user_id', user.id)
      .gte('logged_at', dayStart)
      .lte('logged_at', dayEnd)
      .order('logged_at', { ascending: true }),
    supabase
      .from('food_favourites')
      .select('id, name, calories, protein, carbs, fat')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('daily_targets')
      .select('calories, protein, carbs, fat')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('food_entries')
      .select('name, calories, protein, carbs, fat')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false })
      .limit(60),
  ])

  // Deduplicate recents by name (case-insensitive), newest first
  const seen = new Set<string>()
  const recents: FoodRecent[] = (recentsRaw ?? [])
    .filter(e => {
      const key = e.name.toLowerCase().trim()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, 12) as FoodRecent[]

  const targets: DailyTargets = targetsRaw ?? { calories: 2000, protein: 150, carbs: 200, fat: 60 }

  return (
    <>
      <NavBar />
      <main className="forge-main" style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 120 }}>
        <FoodClient
          entries={(entriesRaw ?? []) as FoodEntry[]}
          favourites={(favouritesRaw ?? []) as FoodFavourite[]}
          targets={targets}
          recents={recents}
        />
      </main>
    </>
  )
}
