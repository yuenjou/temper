'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { getWorkoutDates } from './actions'
import DayDetailSheet from './DayDetailSheet'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

type MonthData = {
  year: number
  month: number
  workoutDays: Set<number>
}

function MonthGrid({
  data,
  todayYear,
  todayMonth,
  todayDay,
  onDayClick,
}: {
  data: MonthData
  todayYear: number
  todayMonth: number
  todayDay: number
  onDayClick: (dateStr: string) => void
}) {
  const { year, month, workoutDays } = data
  const firstDow = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const isCurrentMonth = year === todayYear && month === todayMonth

  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const mm = String(month + 1).padStart(2, '0')

  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{
        fontSize: 14,
        fontWeight: 700,
        color: 'var(--text-primary)',
        margin: '0 0 6px',
        letterSpacing: '-0.01em',
      }}>
        {MONTH_NAMES[month]} {year}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: 2 }}>
        {cells.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} style={{ height: 36 }} />

          const isToday = isCurrentMonth && day === todayDay
          const isFuture = isCurrentMonth && day > todayDay
          const hasWorkout = workoutDays.has(day)
          const dateStr = `${year}-${mm}-${String(day).padStart(2, '0')}`

          return (
            <div
              key={day}
              onClick={isFuture ? undefined : () => onDayClick(dateStr)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: 36,
                gap: 2,
                cursor: isFuture ? 'default' : 'pointer',
                opacity: isFuture ? 0.3 : 1,
              }}
            >
              <div style={{
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                background: isToday ? 'var(--blue)' : 'transparent',
                fontSize: 13,
                fontWeight: isToday ? 600 : 400,
                color: isToday ? '#fff' : 'var(--text-primary)',
                lineHeight: 1,
              }}>
                {day}
              </div>
              <div style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: hasWorkout
                  ? (isToday ? 'rgba(255,255,255,0.6)' : 'var(--accent)')
                  : 'transparent',
              }} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function ActivityCalendar() {
  const today = useRef(new Date()).current
  const todayYear = today.getUTCFullYear()
  const todayMonth = today.getUTCMonth()
  const todayDay = today.getUTCDate()

  const [months, setMonths] = useState<MonthData[]>([])
  const [oldestLoaded, setOldestLoaded] = useState<{ year: number; month: number } | null>(null)
  const [showTopLoader, setShowTopLoader] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const loadingRef = useRef(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const prevScrollHeight = useRef(0)
  const didInitialScroll = useRef(false)

  const loadBatch = useCallback(async (
    endYear: number,
    endMonth: number,
    count: number,
    isPrepend: boolean,
  ) => {
    if (loadingRef.current) return
    loadingRef.current = true
    if (isPrepend) setShowTopLoader(true)

    let startYear = endYear
    let startMonth = endMonth - count + 1
    while (startMonth < 0) { startMonth += 12; startYear-- }

    const startStr = `${startYear}-${String(startMonth + 1).padStart(2, '0')}-01`
    const lastDay = new Date(Date.UTC(endYear, endMonth + 1, 0)).getUTCDate()
    const endStr = `${endYear}-${String(endMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    try {
      const dates = await getWorkoutDates(startStr, endStr)
      const dateSet = new Set(dates)

      const newMonths: MonthData[] = []
      let y = startYear
      let m = startMonth
      for (let i = 0; i < count; i++) {
        const prefix = `${y}-${String(m + 1).padStart(2, '0')}-`
        const workoutDays = new Set<number>()
        for (const d of dateSet) {
          if (d.startsWith(prefix)) workoutDays.add(parseInt(d.slice(8, 10), 10))
        }
        newMonths.push({ year: y, month: m, workoutDays })
        m++
        if (m > 11) { m = 0; y++ }
      }

      if (isPrepend && scrollRef.current) {
        prevScrollHeight.current = scrollRef.current.scrollHeight
      }

      setMonths(prev => [...newMonths, ...prev])
      setOldestLoaded({ year: startYear, month: startMonth })
    } finally {
      loadingRef.current = false
      if (isPrepend) setShowTopLoader(false)
    }
  }, [])

  // Initial load: last 12 months
  useEffect(() => {
    loadBatch(todayYear, todayMonth, 12, false)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // After months update: scroll to bottom (first load) or restore position (prepend)
  useEffect(() => {
    const el = scrollRef.current
    if (!el || months.length === 0) return

    if (!didInitialScroll.current) {
      el.scrollTop = el.scrollHeight
      didInitialScroll.current = true
    } else if (prevScrollHeight.current > 0) {
      el.scrollTop += el.scrollHeight - prevScrollHeight.current
      prevScrollHeight.current = 0
    }
  }, [months])

  // IntersectionObserver: fire when sentinel scrolls into view (user scrolled to top)
  useEffect(() => {
    const sentinel = sentinelRef.current
    const scrollEl = scrollRef.current
    if (!sentinel || !scrollEl || !oldestLoaded) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !loadingRef.current) {
        let prevYear = oldestLoaded.year
        let prevMonth = oldestLoaded.month - 1
        if (prevMonth < 0) { prevMonth = 11; prevYear-- }
        loadBatch(prevYear, prevMonth, 6, true)
      }
    }, { root: scrollEl, threshold: 0 })

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [oldestLoaded, loadBatch])

  return (
    <>
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid var(--hairline)',
        borderRadius: 'var(--r-lg)',
        overflow: 'hidden',
        backdropFilter: 'blur(20px) saturate(1.4)',
      }}>
        {/* Day-of-week header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          padding: '9px 14px 7px',
          borderBottom: '1px solid var(--hairline)',
          background: 'rgba(12,12,16,0.8)',
          backdropFilter: 'blur(12px)',
        }}>
          {DAY_LABELS.map(d => (
            <div key={d} style={{
              textAlign: 'center',
              fontSize: 10,
              fontWeight: 600,
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              {d}
            </div>
          ))}
        </div>

        {/* Scrollable month list */}
        <div ref={scrollRef} style={{ overflowY: 'auto', height: 360, padding: '12px 14px 16px' }}>
          <div ref={sentinelRef} style={{ height: 1 }} />

          {showTopLoader && (
            <div style={{
              textAlign: 'center',
              padding: '6px 0 10px',
              fontSize: 11,
              color: 'var(--text-tertiary)',
            }}>
              Loading…
            </div>
          )}

          {months.map(m => (
            <MonthGrid
              key={`${m.year}-${m.month}`}
              data={m}
              todayYear={todayYear}
              todayMonth={todayMonth}
              todayDay={todayDay}
              onDayClick={setSelectedDate}
            />
          ))}
        </div>
      </div>

      {selectedDate && (
        <DayDetailSheet
          date={selectedDate}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </>
  )
}
