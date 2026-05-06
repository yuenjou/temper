'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import ExerciseIllustration from '@/components/ExerciseIllustration'
import ForgeIcon from '@/components/ForgeIcon'
import {
  finishWorkout,
  getAllExercises,
  createCustomExercise,
  logSet,
  deleteSet,
  checkNewPR,
  getPreviousSets,
} from '../new/actions'
import { getCached, setCached, appendCached, filterCached } from '@/lib/exercise-cache'

type WorkoutSet = { id: string; reps: number; weight: number; weight_unit: string }
type Exercise = { id: string; name: string; category: string; muscle_group: string }
type ExerciseEntry = Exercise & { sets: WorkoutSet[] }
type PrevSet = { reps: number; weight: number; weight_unit: string }

type Props = {
  workoutId: string
  workoutName: string | null
  initialExercises: Exercise[]
  initialSets: Record<string, WorkoutSet[]>
  initialPrevSets: Record<string, PrevSet>
}

const REST_DURATION = 90

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

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${String(sec).padStart(2, '0')}`
}

// ─── SetRow ───────────────────────────────────────────────────────────────────

function SetRow({
  setNum,
  set,
  isPR,
  completed,
  onToggleComplete,
  onDelete,
}: {
  setNum: number
  set: WorkoutSet
  isPR: boolean
  completed: boolean
  onToggleComplete: () => void
  onDelete: () => void
}) {
  const DELETE_W = 72
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const startX = useRef(0)
  const startY = useRef(0)
  const baseOffset = useRef(0)
  const directionLocked = useRef<'h' | 'v' | null>(null)

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
    setOffset(Math.min(0, Math.max(-DELETE_W, baseOffset.current + dx)))
  }

  function handleTouchEnd() {
    setDragging(false)
    if (offset < -DELETE_W / 2) {
      setOffset(-DELETE_W)
      setRevealed(true)
    } else {
      setOffset(0)
      setRevealed(false)
    }
  }

  const textFade: React.CSSProperties = {
    opacity: completed ? 0.38 : 1,
    transition: 'opacity 0.25s ease',
    position: 'relative' as const,
    display: 'inline-block',
  }

  const strikeBar: React.CSSProperties = {
    position: 'absolute', left: 0, top: '55%',
    height: 1.5, borderRadius: 1,
    background: 'var(--text-tertiary)',
    width: completed ? '100%' : '0%',
    transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
  }

  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      borderBottom: '0.5px solid var(--hairline)',
      background: completed
        ? 'rgba(48,209,88,0.04)'
        : isPR ? 'rgba(255,214,10,0.05)' : undefined,
    }}>
      {/* Delete zone */}
      <div
        role="button"
        aria-label="Delete set"
        onClick={onDelete}
        style={{
          position: 'absolute', right: 0, top: 0, bottom: 0, width: DELETE_W,
          background: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <ForgeIcon name="close" size={18} color="#fff" />
      </div>

      {/* Row */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${offset}px)`,
          transition: dragging ? 'none' : 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
          background: completed
            ? 'rgba(48,209,88,0.04)'
            : isPR ? 'rgba(255,214,10,0.05)' : 'var(--surface-1)',
          display: 'grid', gridTemplateColumns: '36px 1fr 1fr', gap: 8,
          padding: '12px 20px', alignItems: 'center',
          userSelect: 'none', touchAction: 'pan-y', WebkitUserSelect: 'none',
        }}
      >
        {/* Completion toggle (tap the number) */}
        <button
          onClick={onToggleComplete}
          style={{
            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
            background: completed ? 'var(--green)' : 'var(--surface-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.2s ease, transform 0.15s ease',
            transform: completed ? 'scale(1.08)' : 'scale(1)',
          }}
        >
          {completed
            ? <ForgeIcon name="check" size={12} color="#fff" strokeWidth={2.5} />
            : <span style={{ fontSize: 12, fontWeight: 700 }}>{setNum}</span>
          }
        </button>

        {/* Weight with animated strikethrough */}
        <span style={{ fontWeight: 600, fontSize: 15 }}>
          <span style={textFade}>
            {set.weight}{' '}
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 500 }}>{set.weight_unit}</span>
            {isPR && !completed && (
              <span style={{ marginLeft: 6, fontSize: 11, color: '#ffd60a', fontWeight: 700 }}>PR</span>
            )}
            <span style={strikeBar} />
          </span>
        </span>

        {/* Reps with animated strikethrough */}
        <span style={{ fontWeight: 600, fontSize: 15 }}>
          <span style={textFade}>
            {set.reps}{' '}
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 500 }}>reps</span>
            <span style={strikeBar} />
          </span>
        </span>
      </div>
    </div>
  )
}

// ─── RestTimer ────────────────────────────────────────────────────────────────

function RestTimer({ seconds, onDismiss }: { seconds: number; onDismiss: () => void }) {
  const C = 2 * Math.PI * 20
  const dash = C * (seconds / REST_DURATION)
  const warn = seconds <= 10

  return (
    <div style={{
      position: 'fixed', bottom: 90, left: 0, right: 0, zIndex: 19,
      display: 'flex', justifyContent: 'center', padding: '0 20px',
      pointerEvents: 'none',
    }}>
      <div className="forge-main" style={{ width: '100%', pointerEvents: 'auto' }} onClick={onDismiss}>
        <div style={{
          background: 'var(--surface-1)',
          border: `0.5px solid ${warn ? 'rgba(255,159,10,0.4)' : 'var(--hairline-strong)'}`,
          borderRadius: 'var(--r-lg)',
          padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: 14,
          boxShadow: '0 4px 32px rgba(0,0,0,0.45)',
          cursor: 'pointer',
        }}>
          <div style={{ flex: 1 }}>
            <p style={{
              fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)',
              textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0,
            }}>Rest Timer</p>
            <p style={{
              fontSize: 30, fontWeight: 700, letterSpacing: '-0.04em', margin: '1px 0 0',
              color: warn ? 'var(--orange)' : 'var(--text-primary)',
              transition: 'color 0.3s ease',
            }}>{formatTime(seconds)}</p>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: 0, paddingRight: 4 }}>tap to skip</p>
          <div style={{ position: 'relative', width: 48, height: 48, flexShrink: 0 }}>
            <svg width={48} height={48} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={24} cy={24} r={20} fill="none" stroke="var(--surface-2)" strokeWidth={3} />
              <circle
                cx={24} cy={24} r={20} fill="none"
                stroke={warn ? 'var(--orange)' : 'var(--accent)'}
                strokeWidth={3}
                strokeDasharray={`${C}`}
                strokeDashoffset={`${C - dash}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s ease' }}
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ForgeIcon name="close" size={11} color="var(--text-tertiary)" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── WorkoutLogger ────────────────────────────────────────────────────────────

export default function WorkoutLogger({
  workoutId,
  workoutName,
  initialExercises,
  initialSets,
  initialPrevSets,
}: Props) {
  const router = useRouter()

  const [entries, setEntries] = useState<ExerciseEntry[]>(() =>
    initialExercises.map(ex => ({ ...ex, sets: initialSets[ex.id] ?? [] }))
  )
  const [inputs, setInputs] = useState<Record<string, { reps: string; weight: string }>>(() =>
    Object.fromEntries(initialExercises.map(ex => [ex.id, { reps: '', weight: '' }]))
  )
  const [prSetIds, setPrSetIds] = useState<Record<string, boolean>>({})
  const [completedSetIds, setCompletedSetIds] = useState<Set<string>>(new Set())
  const [exerciseNotes, setExerciseNotes] = useState<Record<string, string>>({})
  const [prevSetsState, setPrevSetsState] = useState<Record<string, PrevSet>>(initialPrevSets)
  const [activeExIdx, setActiveExIdx] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [restSeconds, setRestSeconds] = useState<number | null>(null)

  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Exercise[]>([])
  const [isLoadingExercises, setIsLoadingExercises] = useState(false)
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customCategory, setCustomCategory] = useState('')
  const [customMuscleGroup, setCustomMuscleGroup] = useState('')

  // Elapsed timer
  useEffect(() => {
    const id = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => clearInterval(id)
  }, [])

  // Rest countdown
  useEffect(() => {
    if (restSeconds === null) return
    if (restSeconds <= 0) { setRestSeconds(null); return }
    const id = setTimeout(() => setRestSeconds(s => (s !== null && s > 0 ? s - 1 : null)), 1000)
    return () => clearTimeout(id)
  }, [restSeconds])

  useEffect(() => {
    setSearchResults(filterCached(searchQuery))
  }, [searchQuery])

  // ── Prev hint ─────────────────────────────────────────────────────────────

  function getPrevHint(exerciseId: string): PrevSet | null {
    const entry = entries.find(e => e.id === exerciseId)
    if (entry && entry.sets.length > 0) {
      const last = entry.sets[entry.sets.length - 1]
      return { reps: last.reps, weight: last.weight, weight_unit: last.weight_unit }
    }
    return prevSetsState[exerciseId] ?? null
  }

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function openSearch() {
    setShowSearch(true)
    if (!getCached()) {
      setIsLoadingExercises(true)
      const exercises = await getAllExercises()
      setCached(exercises)
      setIsLoadingExercises(false)
      if (searchQuery.length >= 2) setSearchResults(filterCached(searchQuery))
    }
  }

  async function addExercise(ex: Exercise) {
    if (entries.some(e => e.id === ex.id)) { closeSearch(); return }
    setActiveExIdx(entries.length)
    setEntries(prev => [...prev, { ...ex, sets: [] }])
    setInputs(prev => ({ ...prev, [ex.id]: { reps: '', weight: '' } }))
    closeSearch()
    getPreviousSets([ex.id], workoutId).then(result => {
      if (result[ex.id]) setPrevSetsState(prev => ({ ...prev, [ex.id]: result[ex.id] }))
    })
  }

  function closeSearch() {
    setShowSearch(false)
    setShowCustomForm(false)
    setSearchQuery('')
    setSearchResults([])
  }

  function setInput(exerciseId: string, field: 'reps' | 'weight', value: string) {
    setInputs(prev => ({ ...prev, [exerciseId]: { ...prev[exerciseId], [field]: value } }))
  }

  async function handleAddSet(exerciseId: string) {
    const { reps: repsStr, weight: weightStr } = inputs[exerciseId] ?? {}

    const hint = getPrevHint(exerciseId)
    const repsVal = repsStr || (hint ? String(hint.reps) : '')
    const weightVal = weightStr || (hint ? String(hint.weight) : '')

    const reps = parseInt(repsVal)
    const weight = parseFloat(weightVal)
    if (!reps || !weight) return

    const set = await logSet(workoutId, exerciseId, reps, weight)
    setEntries(prev => prev.map(e => e.id === exerciseId ? { ...e, sets: [...e.sets, set] } : e))
    setInputs(prev => ({ ...prev, [exerciseId]: { reps: '', weight: '' } }))
    setRestSeconds(REST_DURATION)

    checkNewPR(exerciseId, reps).then(isPR => {
      if (isPR) setPrSetIds(prev => ({ ...prev, [set.id]: true }))
    })
  }

  function toggleSetComplete(setId: string) {
    setCompletedSetIds(prev => {
      const next = new Set(prev)
      if (next.has(setId)) next.delete(setId)
      else next.add(setId)
      return next
    })
  }

  async function handleDeleteSet(exerciseId: string, setId: string) {
    await deleteSet(setId)
    setEntries(prev => prev.map(e =>
      e.id === exerciseId ? { ...e, sets: e.sets.filter(s => s.id !== setId) } : e
    ))
    setCompletedSetIds(prev => { const n = new Set(prev); n.delete(setId); return n })
  }

  async function handleCreateCustom() {
    if (!customName.trim()) return
    const ex = await createCustomExercise(customName.trim(), customCategory.trim(), customMuscleGroup.trim())
    appendCached(ex)
    addExercise(ex)
    setCustomName(''); setCustomCategory(''); setCustomMuscleGroup('')
  }

  async function handleFinish() {
    await finishWorkout(workoutId)
    router.push('/dashboard')
  }

  // ── Computed ──────────────────────────────────────────────────────────────

  const clampedIdx = Math.min(activeExIdx, Math.max(0, entries.length - 1))
  const activeEntry = entries[clampedIdx] ?? null
  const totalSets = entries.reduce((a, e) => a + e.sets.length, 0)
  const prevHint = activeEntry ? getPrevHint(activeEntry.id) : null
  const lastSessionBest = activeEntry ? prevSetsState[activeEntry.id] ?? null : null

  const inputStyle: React.CSSProperties = {
    flex: 1, padding: '11px 14px',
    background: 'var(--surface-2)', borderRadius: 'var(--r-md)',
    border: 'none', color: 'var(--text-primary)',
    fontSize: 16, fontWeight: 600, outline: 'none',
    fontFamily: 'inherit',
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: 120 }}>
        <div className="forge-main">

          {/* Sticky pill header */}
          <div style={{
            position: 'sticky', top: 0, zIndex: 10,
            background: 'rgba(18,18,20,0.92)',
            backdropFilter: 'saturate(180%) blur(24px)',
            WebkitBackdropFilter: 'saturate(180%) blur(24px)',
            borderBottom: '0.5px solid var(--hairline)',
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 16px',
          }}>
            <button className="forge-icon-btn" onClick={handleFinish} aria-label="Finish workout">
              <ForgeIcon name="check" size={20} />
            </button>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,59,48,0.12)', border: '0.5px solid rgba(255,59,48,0.3)',
                borderRadius: 100, padding: '6px 16px',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {workoutName ?? 'Workout'} &mdash; {formatTime(elapsed)}
                </span>
              </div>
            </div>
            <button className="forge-icon-btn" onClick={openSearch} aria-label="Add exercise">
              <ForgeIcon name="plus" size={20} />
            </button>
          </div>

          {/* Elapsed + sets */}
          <div style={{ padding: '20px 24px 0' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <p className="forge-eyebrow" style={{ marginBottom: 2 }}>Elapsed</p>
                <p style={{ fontSize: 48, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1, margin: 0 }}>
                  {formatTime(elapsed)}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p className="forge-eyebrow" style={{ marginBottom: 2 }}>Sets logged</p>
                <p style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>{totalSets}</p>
              </div>
            </div>
          </div>

          {/* Exercise chips */}
          {entries.length > 0 && (
            <div className="no-scrollbar" style={{ display: 'flex', gap: 8, padding: '16px 16px 0', overflowX: 'auto' }}>
              {entries.map((e, i) => (
                <button
                  key={e.id}
                  onClick={() => setActiveExIdx(i)}
                  style={{
                    flexShrink: 0, padding: '8px 16px', borderRadius: 'var(--r-pill)',
                    background: i === clampedIdx ? 'var(--accent)' : 'var(--surface-2)',
                    color: i === clampedIdx ? '#fff' : 'var(--text-primary)',
                    fontSize: 13, fontWeight: 600, transition: 'all 0.15s ease',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  {e.sets.length > 0 && i !== clampedIdx && (
                    <ForgeIcon name="check" size={12} color="var(--green)" strokeWidth={2.5} />
                  )}
                  {e.name.split(' ').slice(-2).join(' ')}
                  {e.sets.length > 0 && (
                    <span style={{ opacity: 0.65, fontSize: 11 }}>{e.sets.length}</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Active exercise */}
          <div style={{ padding: '16px 20px 0' }}>
            {!activeEntry ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', gap: 16 }}>
                <ForgeIcon name="dumbbell" size={52} color="var(--text-tertiary)" />
                <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: 17, fontWeight: 500 }}>
                  Add your first exercise
                </p>
                <p style={{ color: 'var(--text-tertiary)', margin: 0, fontSize: 14 }}>Tap + to search exercises</p>
              </div>
            ) : (
              <div className="forge-card" style={{ padding: 0, overflow: 'hidden' }}>

                {/* Hero */}
                <div style={{ padding: '20px', display: 'flex', gap: 16, alignItems: 'center', borderBottom: '0.5px solid var(--hairline)' }}>
                  <div style={{ width: 76, height: 76, borderRadius: 16, flexShrink: 0, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ExerciseIllustration name={illustrationFor(activeEntry.name)} size={58} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {(activeEntry.muscle_group || activeEntry.category) && (
                      <p className="forge-eyebrow" style={{ marginBottom: 4 }}>
                        {activeEntry.muscle_group || activeEntry.category}
                      </p>
                    )}
                    <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, lineHeight: 1.2, letterSpacing: '-0.01em' }}>
                      {activeEntry.name}
                    </h2>
                    <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: '4px 0 0', fontWeight: 500 }}>
                      {activeEntry.sets.length > 0
                        ? `${activeEntry.sets.length} set${activeEntry.sets.length !== 1 ? 's' : ''} logged`
                        : lastSessionBest
                          ? `Last session: ${lastSessionBest.weight}${lastSessionBest.weight_unit} × ${lastSessionBest.reps}`
                          : 'No previous data'}
                    </p>
                  </div>
                </div>

                {/* Sets table header */}
                {activeEntry.sets.length > 0 && (
                  <div style={{
                    display: 'grid', gridTemplateColumns: '36px 1fr 1fr', gap: 8,
                    padding: '10px 20px', borderBottom: '0.5px solid var(--hairline)',
                    fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>
                    <span>#</span><span>Weight</span><span>Reps</span>
                  </div>
                )}

                {/* Set rows */}
                {activeEntry.sets.map((s, i) => (
                  <SetRow
                    key={s.id}
                    setNum={i + 1}
                    set={s}
                    isPR={!!prSetIds[s.id]}
                    completed={completedSetIds.has(s.id)}
                    onToggleComplete={() => toggleSetComplete(s.id)}
                    onDelete={() => handleDeleteSet(activeEntry.id, s.id)}
                  />
                ))}

                {/* Input row */}
                <div style={{ padding: '12px 16px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {prevHint && (
                    <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: 0, paddingLeft: 2 }}>
                      {activeEntry.sets.length > 0 ? 'Last set:' : 'Previous:'}{' '}
                      <span style={{ fontWeight: 600 }}>
                        {prevHint.weight}{prevHint.weight_unit} × {prevHint.reps} reps
                      </span>
                      {activeEntry.sets.length === 0 && (
                        <span style={{ color: 'var(--text-tertiary)', opacity: 0.7 }}> — tap Add to match</span>
                      )}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      type="number"
                      inputMode="decimal"
                      placeholder={prevHint ? String(prevHint.weight) : 'kg'}
                      value={inputs[activeEntry.id]?.weight ?? ''}
                      onChange={e => setInput(activeEntry.id, 'weight', e.target.value)}
                      style={inputStyle}
                    />
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder={prevHint ? String(prevHint.reps) : 'reps'}
                      value={inputs[activeEntry.id]?.reps ?? ''}
                      onChange={e => setInput(activeEntry.id, 'reps', e.target.value)}
                      style={inputStyle}
                    />
                    <button
                      onClick={() => handleAddSet(activeEntry.id)}
                      style={{
                        padding: '11px 20px', flexShrink: 0,
                        background: 'var(--accent)', color: '#fff',
                        borderRadius: 'var(--r-md)', fontWeight: 700, fontSize: 15,
                        transition: 'background 0.15s ease',
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Notes field */}
                <div style={{ padding: '10px 16px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ paddingTop: 11, flexShrink: 0 }}>
                    <ForgeIcon name="pencil" size={14} color="var(--text-tertiary)" />
                  </div>
                  <textarea
                    value={exerciseNotes[activeEntry.id] ?? ''}
                    onChange={e => setExerciseNotes(prev => ({ ...prev, [activeEntry.id]: e.target.value }))}
                    placeholder="Add a note for this exercise…"
                    rows={1}
                    style={{
                      flex: 1,
                      background: 'none',
                      border: 'none',
                      outline: 'none',
                      resize: 'none',
                      color: exerciseNotes[activeEntry.id] ? 'var(--text-secondary)' : 'var(--text-tertiary)',
                      fontSize: 13,
                      fontFamily: 'inherit',
                      lineHeight: 1.5,
                      padding: '10px 0',
                      minHeight: 40,
                      overflow: 'hidden',
                    }}
                    onInput={e => {
                      const el = e.currentTarget
                      el.style.height = 'auto'
                      el.style.height = `${el.scrollHeight}px`
                    }}
                  />
                </div>

              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rest timer */}
      {restSeconds !== null && (
        <RestTimer seconds={restSeconds} onDismiss={() => setRestSeconds(null)} />
      )}

      {/* Fixed bottom bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20,
        background: 'rgba(28,28,30,0.92)',
        backdropFilter: 'saturate(180%) blur(28px)',
        WebkitBackdropFilter: 'saturate(180%) blur(28px)',
        borderTop: '0.5px solid var(--hairline)',
      }}>
        <div className="forge-main" style={{ display: 'flex', gap: 10, padding: '12px 20px 28px' }}>
          <button onClick={openSearch} className="forge-btn-secondary" style={{ flex: 1, fontSize: 15 }}>
            <ForgeIcon name="plus" size={18} /> Exercise
          </button>
          <button onClick={handleFinish} className="forge-btn-primary" style={{ flex: 2 }}>
            Finish Workout
          </button>
        </div>
      </div>

      {/* Exercise search modal */}
      {showSearch && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
          onClick={closeSearch}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 540,
              background: 'var(--surface-1)',
              borderRadius: '24px 24px 0 0',
              padding: '20px 20px 40px',
              border: '0.5px solid var(--hairline-strong)',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ width: 36, height: 4, background: 'var(--surface-3)', borderRadius: 2, margin: '0 auto 20px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
                {showCustomForm ? 'New Exercise' : 'Add Exercise'}
              </h2>
              <button className="forge-icon-btn" onClick={closeSearch}>
                <ForgeIcon name="close" size={18} />
              </button>
            </div>

            {!showCustomForm ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 'var(--r-md)', marginBottom: 12 }}>
                  <ForgeIcon name="search" size={16} color="var(--text-tertiary)" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search exercises…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 15, fontFamily: 'inherit' }}
                  />
                </div>
                <div style={{ maxHeight: 280, overflowY: 'auto' }} className="no-scrollbar">
                  {searchResults.map(ex => (
                    <button
                      key={ex.id}
                      onClick={() => addExercise(ex)}
                      style={{ width: '100%', textAlign: 'left', padding: '12px 8px', borderBottom: '0.5px solid var(--hairline)', display: 'flex', alignItems: 'center', gap: 12, borderRadius: 0 }}
                    >
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <ExerciseIllustration name={illustrationFor(ex.name)} size={30} />
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, margin: 0, fontSize: 15 }}>{ex.name}</p>
                        {ex.category && (
                          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: '2px 0 0' }}>
                            {ex.category}{ex.muscle_group ? ` · ${ex.muscle_group}` : ''}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                  {isLoadingExercises && (
                    <p style={{ color: 'var(--text-tertiary)', fontSize: 14, textAlign: 'center', padding: '24px 0 8px' }}>Loading…</p>
                  )}
                  {!isLoadingExercises && searchQuery.length >= 2 && searchResults.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '32px 20px' }}>
                      <p style={{ color: 'var(--text-secondary)', margin: '0 0 12px' }}>No exercises found</p>
                      <button onClick={() => setShowCustomForm(true)} style={{ color: 'var(--accent)', fontSize: 14, fontWeight: 600 }}>
                        Create &quot;{searchQuery}&quot; as custom
                      </button>
                    </div>
                  )}
                  {searchQuery.length < 2 && (
                    <p style={{ color: 'var(--text-tertiary)', fontSize: 14, textAlign: 'center', padding: '24px 0 8px' }}>
                      Type at least 2 characters to search
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input
                  autoFocus
                  type="text"
                  placeholder="Exercise name *"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  style={{ padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 'var(--r-md)', border: 'none', color: 'var(--text-primary)', fontSize: 15, fontFamily: 'inherit', outline: 'none' }}
                />
                <input
                  type="text"
                  placeholder="Category (e.g. Strength)"
                  value={customCategory}
                  onChange={e => setCustomCategory(e.target.value)}
                  style={{ padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 'var(--r-md)', border: 'none', color: 'var(--text-primary)', fontSize: 15, fontFamily: 'inherit', outline: 'none' }}
                />
                <input
                  type="text"
                  placeholder="Muscle group (e.g. Chest)"
                  value={customMuscleGroup}
                  onChange={e => setCustomMuscleGroup(e.target.value)}
                  style={{ padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 'var(--r-md)', border: 'none', color: 'var(--text-primary)', fontSize: 15, fontFamily: 'inherit', outline: 'none' }}
                />
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button onClick={() => setShowCustomForm(false)} className="forge-btn-secondary" style={{ flex: 1, fontSize: 15 }}>Back</button>
                  <button
                    onClick={handleCreateCustom}
                    disabled={!customName.trim()}
                    className="forge-btn-primary"
                    style={{ flex: 2, opacity: customName.trim() ? 1 : 0.45 }}
                  >
                    Create &amp; Add
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
