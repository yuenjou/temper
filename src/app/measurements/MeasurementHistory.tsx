'use client'

import { useEffect, useRef, useState } from 'react'
import ForgeIcon from '@/components/ForgeIcon'
import BodyweightChart from './BodyweightChart'
import { deleteMeasurement } from './actions'

type Entry = { id: string; value: number; unit: string; recorded_at: string }

const TYPE_LABELS: Record<string, string> = {
  bodyweight: 'Bodyweight',
  body_fat: 'Body Fat',
  waist: 'Waist',
  chest: 'Chest',
  arms: 'Arms',
}

const DELETE_W = 80
const FULL_DELETE = 200

function MeasurementRow({
  entry,
  isLatest,
  onDelete,
}: {
  entry: Entry
  isLatest: boolean
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
      const t = setTimeout(onDelete, 320)
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
      await deleteMeasurement(entry.id)
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
    await deleteMeasurement(entry.id)
    setRemoving(true)
  }

  const deleteProgress = Math.min(1, Math.abs(offset) / DELETE_W)
  const date = new Date(entry.recorded_at)

  return (
    <div style={{
      maxHeight: removing ? 0 : 80,
      opacity: removing ? 0 : 1,
      overflow: 'hidden',
      transition: 'max-height 0.32s ease, opacity 0.25s ease',
    }}>
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Delete zone */}
        <div
          role="button"
          aria-label="Delete entry"
          onClick={handleDeleteClick}
          style={{
            position: 'absolute', right: 0, top: 0, bottom: 0,
            width: Math.max(DELETE_W, Math.abs(offset)),
            background: '#ff3b30',
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
            paddingRight: 24,
            opacity: deleteProgress,
            cursor: 'pointer',
          }}
        >
          <ForgeIcon name="trash" size={18} color="#fff" />
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
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: isLatest ? '10px 0 6px' : '6px 0',
            userSelect: 'none', touchAction: 'pan-y', WebkitUserSelect: 'none',
          }}
        >
          <span style={{
            fontSize: isLatest ? 13 : 13,
            color: isLatest ? 'var(--text-tertiary)' : 'var(--text-tertiary)',
          }}>
            {date.toLocaleDateString(undefined, {
              month: 'short', day: 'numeric',
              ...(isLatest ? { weekday: 'short' } : {}),
            })}
          </span>
          <span style={{
            fontWeight: isLatest ? 700 : 500,
            fontSize: isLatest ? 28 : 15,
            letterSpacing: isLatest ? '-0.02em' : undefined,
            color: 'var(--text-primary)',
          }}>
            {entry.value}
            <span style={{ fontSize: isLatest ? 14 : 12, color: 'var(--text-tertiary)', fontWeight: 400, marginLeft: 4 }}>
              {entry.unit}
            </span>
          </span>
        </div>
      </div>
    </div>
  )
}

function MeasurementTypeCard({ type, entries: initial }: { type: string; entries: Entry[] }) {
  const [entries, setEntries] = useState(initial)
  const [showAll, setShowAll] = useState(false)

  function remove(id: string) {
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  if (entries.length === 0) return null

  const [latest, ...prior] = entries
  const visiblePrior = showAll ? prior : prior.slice(0, 3)

  return (
    <div style={{
      background: 'var(--surface-1)', borderRadius: 'var(--r-lg)',
      boxShadow: 'var(--shadow-card)', padding: '16px 20px',
      overflow: 'hidden',
    }}>
      <h2 style={{ fontWeight: 600, fontSize: 14, margin: '0 0 2px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {TYPE_LABELS[type] ?? type}
      </h2>

      <MeasurementRow entry={latest} isLatest onDelete={() => remove(latest.id)} />

      {type === 'bodyweight' && entries.length >= 2 && (
        <div style={{ borderTop: '0.5px solid var(--hairline)', paddingTop: 12, margin: '4px 0 8px' }}>
          <BodyweightChart entries={entries.map(m => ({ value: m.value, recorded_at: m.recorded_at }))} />
        </div>
      )}

      {prior.length > 0 && (
        <div style={{ borderTop: '0.5px solid var(--hairline)', marginTop: 4, paddingTop: 4 }}>
          {visiblePrior.map(m => (
            <MeasurementRow key={m.id} entry={m} isLatest={false} onDelete={() => remove(m.id)} />
          ))}
          {prior.length > 3 && (
            <button
              onClick={() => setShowAll(p => !p)}
              style={{ fontSize: 13, color: 'var(--text-tertiary)', paddingTop: 6, display: 'block' }}
            >
              {showAll ? 'Show less' : `${prior.length - 3} more…`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

const TYPES_ORDER = ['bodyweight', 'body_fat', 'waist', 'chest', 'arms']

export default function MeasurementHistory({ grouped }: { grouped: Record<string, Entry[]> }) {
  const types = TYPES_ORDER.filter(t => grouped[t])

  if (types.length === 0) {
    return (
      <div style={{
        background: 'var(--surface-1)', borderRadius: 'var(--r-lg)',
        boxShadow: 'var(--shadow-card)', padding: '32px 20px', textAlign: 'center',
      }}>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No measurements yet</p>
        <p style={{ color: 'var(--text-tertiary)', fontSize: 14, margin: '4px 0 0' }}>Log your first one above!</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {types.map(type => (
        <MeasurementTypeCard key={type} type={type} entries={grouped[type]} />
      ))}
    </div>
  )
}
