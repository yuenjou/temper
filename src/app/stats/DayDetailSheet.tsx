'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import ExerciseIllustration from '@/components/ExerciseIllustration'
import {
  getWorkoutsForDate,
  getMeasurementsForDate,
  getFoodEntriesForDate,
  type WorkoutDetail,
  type MeasurementEntry,
  type FoodEntry,
} from './actions'

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snacks']

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z')
  return `${WEEKDAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

function formatDuration(startedAt: string, finishedAt: string): string {
  const mins = Math.round(
    (new Date(finishedAt).getTime() - new Date(startedAt).getTime()) / 60000
  )
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

function illustrationFor(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('bench') || (n.includes('press') && n.includes('chest'))) return 'bench-press'
  if (n.includes('squat')) return 'squat'
  if (n.includes('deadlift')) return 'deadlift'
  if (n.includes('row')) return 'row'
  if (n.includes('press') || n.includes('overhead') || n.includes('ohp')) return 'press'
  if (n.includes('curl')) return 'curl'
  return 'bench-press'
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid var(--hairline)',
      borderRadius: 'var(--r-md)',
      overflow: 'hidden',
    }}>
      {children}
    </div>
  )
}

function WorkoutCard({ workout }: { workout: WorkoutDetail }) {
  const duration = formatDuration(workout.started_at, workout.finished_at)
  const totalSets = workout.exercises.reduce((acc, ex) => acc + ex.sets.length, 0)

  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
      }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
          {workout.name ?? 'Workout'}
        </p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{
            fontSize: 11, fontWeight: 500,
            color: 'var(--text-tertiary)',
            background: 'var(--surface-2)',
            padding: '2px 8px',
            borderRadius: 'var(--r-pill)',
          }}>
            {duration}
          </span>
          <span style={{
            fontSize: 11, fontWeight: 500,
            color: 'var(--text-tertiary)',
            background: 'var(--surface-2)',
            padding: '2px 8px',
            borderRadius: 'var(--r-pill)',
          }}>
            {totalSets} sets
          </span>
        </div>
      </div>

      <SectionCard>
        {workout.exercises.map((ex, i) => (
          <div key={ex.id} style={{
            padding: '12px 14px',
            borderTop: i > 0 ? '1px solid var(--hairline)' : undefined,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <ExerciseIllustration name={illustrationFor(ex.name)} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  {ex.name}
                </p>
                {ex.muscle_group && (
                  <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '2px 0 0', textTransform: 'capitalize' }}>
                    {ex.muscle_group}
                  </p>
                )}
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '20px 1fr 1fr',
              rowGap: 4,
              columnGap: 8,
              paddingLeft: 46,
            }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.04em' }}>#</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.04em' }}>WEIGHT</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.04em' }}>REPS</span>
              {ex.sets.map((set, si) => (
                <React.Fragment key={set.id}>
                  <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{si + 1}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>
                    {set.weight} <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{set.weight_unit}</span>
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>
                    {set.reps}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
      </SectionCard>

      <Link
        href={`/workout/${workout.id}`}
        style={{
          display: 'block',
          textAlign: 'center',
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--accent)',
          textDecoration: 'none',
          padding: '6px 0',
        }}
      >
        View full workout →
      </Link>
    </div>
  )
}

function FoodSection({ entries }: { entries: FoodEntry[] }) {
  const totalCalories = entries.reduce((a, e) => a + e.calories, 0)
  const totalProtein = entries.reduce((a, e) => a + e.protein, 0)
  const totalCarbs = entries.reduce((a, e) => a + e.carbs, 0)
  const totalFat = entries.reduce((a, e) => a + e.fat, 0)

  const byMeal = new Map<string, FoodEntry[]>()
  for (const entry of entries) {
    if (!byMeal.has(entry.meal_type)) byMeal.set(entry.meal_type, [])
    byMeal.get(entry.meal_type)!.push(entry)
  }

  const orderedMeals = [
    ...MEAL_ORDER.filter(m => byMeal.has(m)),
    ...[...byMeal.keys()].filter(k => !MEAL_ORDER.includes(k)),
  ]

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'baseline',
        justifyContent: 'space-between', marginBottom: 10,
      }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Food</p>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>{totalCalories} kcal</span>
      </div>

      <SectionCard>
        {orderedMeals.map((meal, mi) => (
          <div key={meal} style={{ borderTop: mi > 0 ? '1px solid var(--hairline)' : undefined }}>
            <div style={{ padding: '10px 14px' }}>
              <p style={{
                fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)',
                textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 6px',
              }}>
                {meal.charAt(0).toUpperCase() + meal.slice(1)}
              </p>
              {byMeal.get(meal)!.map(entry => (
                <div key={entry.id} style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', padding: '2px 0',
                }}>
                  <span style={{ fontSize: 13, color: 'var(--text-primary)', flex: 1, minWidth: 0 }}>
                    {entry.name}
                  </span>
                  <span style={{
                    fontSize: 13, color: 'var(--text-secondary)',
                    fontWeight: 500, marginLeft: 12, flexShrink: 0,
                  }}>
                    {entry.calories} kcal
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div style={{
          padding: '10px 14px',
          borderTop: '1px solid var(--hairline)',
          background: 'rgba(255,255,255,0.02)',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
        }}>
          {[
            { label: 'Protein', value: totalProtein },
            { label: 'Carbs', value: totalCarbs },
            { label: 'Fat', value: totalFat },
          ].map(({ label, value }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                {Math.round(value)}<span style={{ fontSize: 10, color: 'var(--text-tertiary)', marginLeft: 1 }}>g</span>
              </p>
              <p style={{
                fontSize: 10, color: 'var(--text-tertiary)', margin: '2px 0 0',
                textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600,
              }}>
                {label}
              </p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

function MeasurementsSection({ entries }: { entries: MeasurementEntry[] }) {
  return (
    <div>
      <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 10px' }}>
        Measurements
      </p>
      <SectionCard>
        {entries.map((entry, i) => (
          <div key={entry.id} style={{
            padding: '12px 14px',
            borderTop: i > 0 ? '1px solid var(--hairline)' : undefined,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 14, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
              {entry.type}
            </span>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              {entry.value}{' '}
              <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-tertiary)' }}>{entry.unit}</span>
            </span>
          </div>
        ))}
      </SectionCard>
    </div>
  )
}

export default function DayDetailSheet({
  date,
  onClose,
}: {
  date: string
  onClose: () => void
}) {
  const [loading, setLoading] = useState(true)
  const [workouts, setWorkouts] = useState<WorkoutDetail[]>([])
  const [measurements, setMeasurements] = useState<MeasurementEntry[]>([])
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([])

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getWorkoutsForDate(date),
      getMeasurementsForDate(date),
      getFoodEntriesForDate(date),
    ]).then(([w, m, f]) => {
      setWorkouts(w)
      setMeasurements(m)
      setFoodEntries(f)
      setLoading(false)
    })
  }, [date])

  const isEmpty = workouts.length === 0 && measurements.length === 0 && foodEntries.length === 0

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 540,
          background: 'rgba(12, 12, 18, 0.92)',
          backdropFilter: 'blur(60px) saturate(200%)',
          WebkitBackdropFilter: 'blur(60px) saturate(200%)',
          borderRadius: '24px 24px 0 0',
          padding: '12px 20px 48px',
          border: '0.5px solid rgba(255,255,255,0.12)',
          borderTopColor: 'rgba(255,255,255,0.18)',
          boxShadow: '0 -8px 60px rgba(0,0,0,0.6)',
          maxHeight: '82vh',
          overflowY: 'auto',
        }}
      >
        {/* Drag handle */}
        <div style={{
          width: 36,
          height: 4,
          background: 'var(--surface-3)',
          borderRadius: 2,
          margin: '0 auto 16px',
        }} />

        {/* Date header */}
        <p style={{ fontSize: 17, fontWeight: 700, margin: '0 0 20px', color: 'var(--text-primary)' }}>
          {formatDate(date)}
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-tertiary)', fontSize: 14 }}>
            Loading…
          </div>
        ) : isEmpty ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <p style={{ fontSize: 32, margin: '0 0 10px' }}>🧘</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, fontWeight: 600, margin: 0 }}>
              Rest day
            </p>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 13, margin: '4px 0 0' }}>
              No activity logged
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {workouts.length > 0 && workouts.map(w => (
              <WorkoutCard key={w.id} workout={w} />
            ))}
            {foodEntries.length > 0 && (
              <FoodSection entries={foodEntries} />
            )}
            {measurements.length > 0 && (
              <MeasurementsSection entries={measurements} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
