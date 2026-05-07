export function calculateStreak(finishedAts: string[]): number {
  if (finishedAts.length === 0) return 0
  const dates = new Set(finishedAts.map(d => d.slice(0, 10)))
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const yesterday = new Date(now)
  yesterday.setUTCDate(yesterday.getUTCDate() - 1)
  const yesterdayStr = yesterday.toISOString().slice(0, 10)
  const startStr = dates.has(todayStr) ? todayStr : (dates.has(yesterdayStr) ? yesterdayStr : null)
  if (!startStr) return 0
  let streak = 0
  const current = new Date(startStr + 'T00:00:00Z')
  while (true) {
    const dateStr = current.toISOString().slice(0, 10)
    if (!dates.has(dateStr)) break
    streak++
    current.setUTCDate(current.getUTCDate() - 1)
  }
  return streak
}
