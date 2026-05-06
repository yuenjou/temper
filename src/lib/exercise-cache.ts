export type CachedExercise = { id: string; name: string; category: string; muscle_group: string }

let data: CachedExercise[] | null = null

export function getCached(): CachedExercise[] | null { return data }
export function setCached(exercises: CachedExercise[]): void { data = exercises }
export function appendCached(exercise: CachedExercise): void {
  if (data) data = [...data, exercise]
}
export function filterCached(query: string): CachedExercise[] {
  if (!data || query.length < 2) return []
  const q = query.toLowerCase()
  return data.filter(ex => ex.name.toLowerCase().includes(q))
}
