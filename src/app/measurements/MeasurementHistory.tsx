'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import ForgeIcon from '@/components/ForgeIcon'
import BodyweightChart from './BodyweightChart'
import { deleteMeasurement, updateMeasurement } from './actions'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
function fmtDate(iso: string, withWeekday = false) {
  const d = new Date(iso)
  const base = `${MONTHS[d.getMonth()]} ${d.getDate()}`
  return withWeekday ? `${WEEKDAYS[d.getDay()]}, ${base}` : base
}

const TYPE_LABELS: Record<string, string> = {
  bodyweight: 'Bodyweight',
  body_fat: 'Body Fat',
  waist: 'Waist',
  chest: 'Chest',
  arms: 'Arms',
}

const DELETE_W = 80
const FULL_DELETE = 200

type Entry = { id: string; value: number; unit: string; recorded_at: string }

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--text-tertiary)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  display: 'block',
  marginBottom: 8,
}

const inputStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  outline: 'none',
  color: 'var(--text-primary)',
  fontFamily: 'inherit',
  width: '100%',
}

function EditSheet({
  entry,
  type,
  onClose,
  onSave,
  onDelete,
}: {
  entry: Entry
  type: string
  onClose: () => void
  onSave: (id: string, value: number, recordedAt: string) => void
  onDelete: (id: string) => void
}) {
  const [value, setValue] = useState(String(entry.value))
  const [date, setDate] = useState(entry.recorded_at.slice(0, 10))
  const [isPending, startTransition] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)
  const today = new Date().toISOString().split('T')[0]

  function handleSave() {
    const num = parseFloat(value)
    if (!num || !date) return
    startTransition(async () => {
      await updateMeasurement(entry.id, num, date)
      onSave(entry.id, num, date)
      onClose()
    })
  }

  async function handleDelete() {
    setIsDeleting(true)
    await deleteMeasurement(entry.id)
    onDelete(entry.id)
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 110,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 540, margin: '0 auto',
          background: 'rgba(18, 18, 26, 0.92)',
          backdropFilter: 'blur(60px) saturate(200%)',
          WebkitBackdropFilter: 'blur(60px) saturate(200%)',
          borderRadius: '24px 24px 0 0',
          padding: '0 20px calc(32px + env(safe-area-inset-bottom))',
          border: '0.5px solid rgba(255,255,255,0.1)',
          borderTopColor: 'rgba(255,255,255,0.16)',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--surface-3)' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0 22px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{TYPE_LABELS[type] ?? type}</h2>
          <button
            onClick={onClose}
            style={{ fontSize: 15, fontWeight: 600, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
          >
            Done
          </button>
        </div>

        {/* Value field */}
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Value</label>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-2)', borderRadius: 14, padding: '12px 16px', border: '0.5px solid var(--hairline-strong)' }}>
            <input
              type="number"
              step="0.1"
              value={value}
              onChange={e => setValue(e.target.value)}
              style={{ ...inputStyle, fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}
            />
            <span style={{ color: 'var(--text-tertiary)', fontSize: 15, fontWeight: 500, flexShrink: 0 }}>{entry.unit}</span>
          </div>
        </div>

        {/* Date field */}
        <div style={{ marginBottom: 28 }}>
          <label style={labelStyle}>Date</label>
          <div style={{ background: 'var(--surface-2)', borderRadius: 14, padding: '12px 16px', border: '0.5px solid var(--hairline-strong)' }}>
            <input
              type="date"
              value={date}
              max={today}
              onChange={e => setDate(e.target.value)}
              style={{ ...inputStyle, fontSize: 15, colorScheme: 'dark' }}
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            style={{
              flex: 1, padding: '14px 0',
              background: 'rgba(255,59,48,0.15)', color: '#ff3b30',
              borderRadius: 'var(--r-md)', fontWeight: 600, fontSize: 15,
              border: 'none', cursor: isDeleting ? 'not-allowed' : 'pointer',
              opacity: isDeleting ? 0.6 : 1,
              fontFamily: 'inherit',
            }}
          >
            {isDeleting ? 'Deleting…' : 'Delete'}
          </button>
          <button
            onClick={handleSave}
            disabled={isPending}
            style={{
              flex: 2, padding: '14px 0',
              background: 'var(--accent)', color: '#fff',
              borderRadius: 'var(--r-md)', fontWeight: 700, fontSize: 15,
              border: 'none', cursor: isPending ? 'not-allowed' : 'pointer',
              opacity: isPending ? 0.6 : 1,
              fontFamily: 'inherit',
            }}
          >
            {isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

function MeasurementRow({
  entry,
  isLatest,
  onDelete,
  onEdit,
}: {
  entry: Entry
  isLatest: boolean
  onDelete: () => void
  onEdit: () => void
}) {
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [removing, setRemoving] = useState(false)
  const startX = useRef(0)
  const startY = useRef(0)
  const baseOffset = useRef(0)
  const directionLocked = useRef<'h' | 'v' | null>(null)
  const hasSwiped = useRef(false)

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
    hasSwiped.current = false
    setDragging(false)
  }

  function handleTouchMove(e: React.TouchEvent) {
    const dx = e.touches[0].clientX - startX.current
    const dy = e.touches[0].clientY - startY.current
    if (!directionLocked.current) {
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
        directionLocked.current = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v'
        if (directionLocked.current === 'h') {
          hasSwiped.current = true
          setDragging(true)
        }
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

  function handleRowClick() {
    if (hasSwiped.current) return
    if (revealed) {
      setOffset(0)
      setRevealed(false)
      return
    }
    onEdit()
  }

  const deleteProgress = Math.min(1, Math.abs(offset) / DELETE_W)

  return (
    <div style={{
      maxHeight: removing ? 0 : isLatest ? 72 : 52,
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
          onClick={handleRowClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            transform: `translateX(${offset}px)`,
            transition: dragging ? 'none' : 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
            background: 'var(--surface-1)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: isLatest ? '10px 0 6px' : '8px 0',
            userSelect: 'none', touchAction: 'pan-y', WebkitUserSelect: 'none',
            cursor: 'pointer',
          }}
        >
          <div>
            <span style={{ fontSize: 13, color: 'var(--text-tertiary)', fontWeight: 500 }}>
              {fmtDate(entry.recorded_at, isLatest)}
            </span>
            {isLatest && (
              <p style={{ fontSize: 10, color: 'var(--accent)', margin: '1px 0 0', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Latest
              </p>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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
            <ForgeIcon name="chevron-right" size={14} color="var(--text-tertiary)" />
          </div>
        </div>
      </div>
    </div>
  )
}

function MeasurementTypeCard({ type, entries: initial }: { type: string; entries: Entry[] }) {
  const [entries, setEntries] = useState(initial)
  const [showAll, setShowAll] = useState(false)
  const [editing, setEditing] = useState<Entry | null>(null)

  function remove(id: string) {
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  function save(id: string, value: number, recordedAt: string) {
    setEntries(prev =>
      prev
        .map(e => e.id === id ? { ...e, value, recorded_at: recordedAt } : e)
        .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())
    )
  }

  if (entries.length === 0) return null

  const [latest, ...prior] = entries
  const visiblePrior = showAll ? prior : prior.slice(0, 3)

  const trend = prior.length > 0
    ? (latest.value - prior[0].value)
    : null

  return (
    <>
      <div style={{
        background: 'var(--surface-1)', borderRadius: 'var(--r-lg)',
        boxShadow: 'var(--shadow-card)', padding: '16px 20px',
        overflow: 'hidden',
      }}>
        {/* Card header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <h2 style={{ fontWeight: 600, fontSize: 13, margin: 0, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {TYPE_LABELS[type] ?? type}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {trend !== null && (
              <span style={{
                fontSize: 12, fontWeight: 600,
                color: trend === 0 ? 'var(--text-tertiary)' : trend > 0 ? '#ff6b6b' : '#30d158',
              }}>
                {trend > 0 ? '+' : ''}{trend.toFixed(1)} {latest.unit}
              </span>
            )}
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 500 }}>
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
            </span>
          </div>
        </div>

        <MeasurementRow
          entry={latest}
          isLatest
          onDelete={() => remove(latest.id)}
          onEdit={() => setEditing(latest)}
        />

        {type === 'bodyweight' && entries.length >= 2 && (
          <div style={{ borderTop: '0.5px solid var(--hairline)', paddingTop: 12, margin: '4px 0 8px' }}>
            <BodyweightChart entries={entries.map(m => ({ value: m.value, recorded_at: m.recorded_at }))} />
          </div>
        )}

        {prior.length > 0 && (
          <div style={{ borderTop: '0.5px solid var(--hairline)', marginTop: 4, paddingTop: 2 }}>
            {visiblePrior.map(m => (
              <MeasurementRow
                key={m.id}
                entry={m}
                isLatest={false}
                onDelete={() => remove(m.id)}
                onEdit={() => setEditing(m)}
              />
            ))}
            {prior.length > 3 && (
              <button
                onClick={() => setShowAll(p => !p)}
                style={{
                  fontSize: 13, fontWeight: 500, color: 'var(--text-tertiary)',
                  paddingTop: 8, display: 'block',
                  background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {showAll ? 'Show less' : `${prior.length - 3} more…`}
              </button>
            )}
          </div>
        )}
      </div>

      {editing && (
        <EditSheet
          entry={editing}
          type={type}
          onClose={() => setEditing(null)}
          onSave={save}
          onDelete={remove}
        />
      )}
    </>
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
