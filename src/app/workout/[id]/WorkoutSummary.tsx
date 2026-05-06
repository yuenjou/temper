'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import ForgeIcon from '@/components/ForgeIcon'
import ExerciseIllustration from '@/components/ExerciseIllustration'
import { deleteSet, deleteWorkout } from '../new/actions'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
function fmtDate(iso: string) {
  const d = new Date(iso)
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`
}

type WorkoutSet = { id: string; reps: number; weight: number; weight_unit: string }
type Exercise = { id: string; name: string; category: string; muscle_group: string }
type ExerciseEntry = Exercise & { sets: WorkoutSet[] }

const DELETE_W = 72
const FULL_DELETE = 180

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

function SummarySetRow({
  setNum,
  set,
  onDelete,
}: {
  setNum: number
  set: WorkoutSet
  onDelete: () => void
}) {
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [removing, setRemoving] = useState(false)
  const startX = useRef(0)
  const startY = useRef(0)
  const baseOffset = useRef(0)
  const directionLocked = useRef<'h' | 'v' | null>(null)

  useEffect(() => {
    if (removing) {
      const t = setTimeout(onDelete, 300)
      return () => clearTimeout(t)
    }
  }, [removing, onDelete])

  function handleTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
    baseOffset.current = revealed ? -DELETE_W : 0
    directionLocked.current = null
    setDragging(false)
  }

  function handleTouchMove(e: React.TouchEvent) {
    const dx = e.touches[0].clientX - startX.current
    const dy = e.touches[0].clientY - startY.current
    if (!directionLocked.current) {
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
        directionLocked.current = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v'
        if (directionLocked.current === 'h') setDragging(true)
      }
      return
    }
    if (directionLocked.current === 'v') return
    setOffset(Math.min(0, Math.max(-(FULL_DELETE + 20), baseOffset.current + dx)))
  }

  async function handleTouchEnd() {
    setDragging(false)
    if (offset < -FULL_DELETE) {
      setOffset(-window.innerWidth)
      await deleteSet(set.id)
      setRemoving(true)
    } else if (offset < -DELETE_W / 2) {
      setOffset(-DELETE_W)
      setRevealed(true)
    } else {
      setOffset(0)
      setRevealed(false)
    }
  }

  async function handleDeleteClick() {
    setOffset(-window.innerWidth)
    await deleteSet(set.id)
    setRemoving(true)
  }

  const deleteProgress = Math.min(1, Math.abs(offset) / DELETE_W)

  return (
    <div style={{
      maxHeight: removing ? 0 : 60,
      opacity: removing ? 0 : 1,
      overflow: 'hidden',
      transition: 'max-height 0.28s ease, opacity 0.22s ease',
    }}>
      <div style={{ position: 'relative', overflow: 'hidden', borderBottom: '0.5px solid var(--hairline)' }}>
        {/* Delete zone */}
        <div
          role="button"
          aria-label="Delete set"
          onClick={handleDeleteClick}
          style={{
            position: 'absolute', right: 0, top: 0, bottom: 0,
            width: Math.max(DELETE_W, Math.abs(offset)),
            background: '#ff3b30',
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
            paddingRight: 20,
            opacity: deleteProgress,
            cursor: 'pointer',
          }}
        >
          <ForgeIcon name="trash" size={16} color="#fff" />
        </div>

        {/* Row */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            transform: `translateX(${offset}px)`,
            transition: dragging ? 'none' : 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
            background: 'var(--surface-1)',
            display: 'grid', gridTemplateColumns: '36px 1fr 1fr',
            gap: 8, padding: '11px 20px', alignItems: 'center',
            userSelect: 'none', touchAction: 'pan-y', WebkitUserSelect: 'none',
          }}
        >
          <div style={{
            width: 26, height: 26, borderRadius: '50%',
            background: 'var(--surface-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700,
          }}>
            {setNum}
          </div>
          <span style={{ fontWeight: 600, fontSize: 15 }}>
            {set.weight}{' '}
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 500 }}>{set.weight_unit}</span>
          </span>
          <span style={{ fontWeight: 600, fontSize: 15 }}>
            {set.reps}{' '}
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 500 }}>reps</span>
          </span>
        </div>
      </div>
    </div>
  )
}

type Props = {
  workoutId: string
  workoutName: string | null
  startedAt: string
  initialEntries: ExerciseEntry[]
}

export default function WorkoutSummary({ workoutId, workoutName, startedAt, initialEntries }: Props) {
  const router = useRouter()
  const [entries, setEntries] = useState(initialEntries)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  function removeSet(exerciseId: string, setId: string) {
    setEntries(prev => prev.map(e =>
      e.id === exerciseId ? { ...e, sets: e.sets.filter(s => s.id !== setId) } : e
    ).filter(e => e.sets.length > 0))
  }

  async function handleDeleteWorkout() {
    setDeleting(true)
    await deleteWorkout(workoutId)
    router.push('/workout/new')
  }

  const totalSets = entries.reduce((n, e) => n + e.sets.length, 0)

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: 120 }}>
      <div className="forge-main">

        {/* Header */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: 'rgba(18,18,20,0.92)',
          backdropFilter: 'saturate(180%) blur(24px)',
          WebkitBackdropFilter: 'saturate(180%) blur(24px)',
          borderBottom: '0.5px solid var(--hairline)',
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 16px',
        }}>
          <button className="forge-icon-btn" onClick={() => router.back()} aria-label="Back">
            <ForgeIcon name="chevron-left" size={20} />
          </button>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <p style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>{workoutName ?? 'Workout'}</p>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: 0 }}>{fmtDate(startedAt)}</p>
          </div>
          <button
            className="forge-icon-btn"
            onClick={() => setConfirmDelete(true)}
            aria-label="Delete workout"
            style={{ color: 'var(--accent)' }}
          >
            <ForgeIcon name="trash" size={18} color="var(--accent)" />
          </button>
        </div>

        {/* Stats */}
        <div style={{ padding: '20px 24px 0', display: 'flex', gap: 24 }}>
          <div>
            <p className="forge-eyebrow" style={{ marginBottom: 2 }}>Exercises</p>
            <p style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>{entries.length}</p>
          </div>
          <div>
            <p className="forge-eyebrow" style={{ marginBottom: 2 }}>Sets</p>
            <p style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>{totalSets}</p>
          </div>
        </div>

        {/* Exercise cards */}
        <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {entries.length === 0 ? (
            <div className="forge-card" style={{ textAlign: 'center', padding: '32px 20px' }}>
              <p style={{ color: 'var(--text-tertiary)', fontSize: 14, margin: 0 }}>No sets remaining</p>
            </div>
          ) : entries.map(entry => (
            <div key={entry.id} className="forge-card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Exercise header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: '0.5px solid var(--hairline)' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--surface-2)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ExerciseIllustration name={illustrationFor(entry.name)} size={32} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>{entry.name}</p>
                  {(entry.muscle_group || entry.category) && (
                    <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: '2px 0 0' }}>
                      {entry.muscle_group || entry.category}
                    </p>
                  )}
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 500 }}>
                  {entry.sets.length} set{entry.sets.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Sets table header */}
              <div style={{
                display: 'grid', gridTemplateColumns: '36px 1fr 1fr', gap: 8,
                padding: '8px 20px',
                fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)',
                textTransform: 'uppercase', letterSpacing: '0.05em',
                borderBottom: '0.5px solid var(--hairline)',
              }}>
                <span>#</span><span>Weight</span><span>Reps</span>
              </div>

              {/* Set rows */}
              {entry.sets.map((s, i) => (
                <SummarySetRow
                  key={s.id}
                  setNum={i + 1}
                  set={s}
                  onDelete={() => removeSet(entry.id, s.id)}
                />
              ))}
            </div>
          ))}
        </div>

      </div>

      {/* Confirm delete overlay */}
      {confirmDelete && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
          onClick={() => setConfirmDelete(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 540,
              background: 'var(--surface-1)',
              borderRadius: '24px 24px 0 0',
              padding: '24px 20px 40px',
              border: '0.5px solid var(--hairline-strong)',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ width: 36, height: 4, background: 'var(--surface-3)', borderRadius: 2, margin: '0 auto 20px' }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 6px' }}>Delete workout?</h2>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 14, margin: '0 0 24px' }}>
              This will permanently remove {workoutName ?? 'this workout'} and all its sets.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setConfirmDelete(false)}
                className="forge-btn-secondary"
                style={{ flex: 1, fontSize: 15 }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteWorkout}
                disabled={deleting}
                style={{
                  flex: 2, padding: '14px 20px',
                  background: '#ff3b30', color: '#fff',
                  borderRadius: 'var(--r-md)', fontWeight: 700, fontSize: 15,
                  opacity: deleting ? 0.6 : 1,
                  cursor: deleting ? 'not-allowed' : 'pointer',
                }}
              >
                {deleting ? 'Deleting…' : 'Delete Workout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
