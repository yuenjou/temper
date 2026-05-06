'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import NavBar from '@/components/NavBar'
import ExerciseIllustration from '@/components/ExerciseIllustration'
import ForgeIcon from '@/components/ForgeIcon'
import {
  finishWorkout,
  getAllExercises,
  createCustomExercise,
  logSet,
  deleteSet,
  checkNewPR,
} from '../new/actions'
import { getCached, setCached, appendCached, filterCached } from '@/lib/exercise-cache'

type WorkoutSet = { id: string; reps: number; weight: number; weight_unit: string }
type Exercise = { id: string; name: string; category: string; muscle_group: string }
type ExerciseEntry = Exercise & { sets: WorkoutSet[] }

type Props = {
  workoutId: string
  workoutName: string | null
  initialExercises: Exercise[]
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

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${String(sec).padStart(2, '0')}`
}

export default function WorkoutLogger({ workoutId, workoutName, initialExercises }: Props) {
  const router = useRouter()

  const [entries, setEntries] = useState<ExerciseEntry[]>(() =>
    initialExercises.map(ex => ({ ...ex, sets: [] }))
  )
  const [inputs, setInputs] = useState<Record<string, { reps: string; weight: string }>>(() =>
    Object.fromEntries(initialExercises.map(ex => [ex.id, { reps: '', weight: '' }]))
  )
  const [prSetIds, setPrSetIds] = useState<Record<string, boolean>>({})
  const [activeExIdx, setActiveExIdx] = useState(0)
  const [elapsed, setElapsed] = useState(0)

  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Exercise[]>([])
  const [isLoadingExercises, setIsLoadingExercises] = useState(false)
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customCategory, setCustomCategory] = useState('')
  const [customMuscleGroup, setCustomMuscleGroup] = useState('')

  useEffect(() => {
    const id = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    setSearchResults(filterCached(searchQuery))
  }, [searchQuery])

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

  function addExercise(ex: Exercise) {
    if (entries.some(e => e.id === ex.id)) { closeSearch(); return }
    setActiveExIdx(entries.length)
    setEntries(prev => [...prev, { ...ex, sets: [] }])
    setInputs(prev => ({ ...prev, [ex.id]: { reps: '', weight: '' } }))
    closeSearch()
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
    const reps = parseInt(repsStr)
    const weight = parseFloat(weightStr)
    if (!reps || !weight) return

    const set = await logSet(workoutId, exerciseId, reps, weight)
    setEntries(prev => prev.map(e => e.id === exerciseId ? { ...e, sets: [...e.sets, set] } : e))
    setInputs(prev => ({ ...prev, [exerciseId]: { reps: '', weight: '' } }))
    checkNewPR(exerciseId, reps).then(isPR => {
      if (isPR) setPrSetIds(prev => ({ ...prev, [set.id]: true }))
    })
  }

  async function handleDeleteSet(exerciseId: string, setId: string) {
    await deleteSet(setId)
    setEntries(prev => prev.map(e =>
      e.id === exerciseId ? { ...e, sets: e.sets.filter(s => s.id !== setId) } : e
    ))
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

  const clampedIdx = Math.min(activeExIdx, Math.max(0, entries.length - 1))
  const activeEntry = entries[clampedIdx] ?? null
  const totalSets = entries.reduce((a, e) => a + e.sets.length, 0)

  const inputStyle: React.CSSProperties = {
    flex: 1, padding: '11px 14px',
    background: 'var(--surface-2)', borderRadius: 'var(--r-md)',
    border: 'none', color: 'var(--text-primary)',
    fontSize: 16, fontWeight: 600, outline: 'none',
    fontFamily: 'inherit',
  }

  return (
    <>
      <NavBar />
      <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: 120 }}>
        <div className="forge-main">

          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px',
            borderBottom: '0.5px solid var(--hairline)',
          }}>
            <button className="forge-icon-btn" onClick={handleFinish} aria-label="Finish workout">
              <ForgeIcon name="check" size={20} />
            </button>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                ● Live
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, marginTop: 2 }}>
                {workoutName ?? 'Workout'}
              </div>
            </div>
            <button className="forge-icon-btn" onClick={openSearch} aria-label="Add exercise">
              <ForgeIcon name="plus" size={20} />
            </button>
          </div>

          {/* Timer + sets */}
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

          {/* Active exercise or empty state */}
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

                {/* Exercise hero */}
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
                    {activeEntry.sets.length > 0 && (
                      <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: '4px 0 0', fontWeight: 500 }}>
                        {activeEntry.sets.length} set{activeEntry.sets.length !== 1 ? 's' : ''} logged
                      </p>
                    )}
                  </div>
                </div>

                {/* Sets table */}
                {activeEntry.sets.length > 0 && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 1fr 36px', gap: 8, padding: '10px 20px', borderBottom: '0.5px solid var(--hairline)', fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <span>#</span><span>Weight</span><span>Reps</span><span />
                    </div>
                    {activeEntry.sets.map((s, i) => (
                      <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '36px 1fr 1fr 36px', gap: 8, padding: '12px 20px', alignItems: 'center', borderBottom: '0.5px solid var(--hairline)', background: prSetIds[s.id] ? 'rgba(255,214,10,0.05)' : undefined }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
                          {i + 1}
                        </div>
                        <span style={{ fontWeight: 600, fontSize: 15 }}>
                          {s.weight}{' '}
                          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 500 }}>{s.weight_unit}</span>
                          {prSetIds[s.id] && <span style={{ marginLeft: 6, fontSize: 11, color: '#ffd60a', fontWeight: 700 }}>PR</span>}
                        </span>
                        <span style={{ fontWeight: 600, fontSize: 15 }}>
                          {s.reps}{' '}
                          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 500 }}>reps</span>
                        </span>
                        <button onClick={() => handleDeleteSet(activeEntry.id, s.id)} style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
                          <ForgeIcon name="close" size={12} />
                        </button>
                      </div>
                    ))}
                  </>
                )}

                {/* Input row */}
                <div style={{ padding: '14px 16px', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="number" inputMode="decimal" placeholder="kg" value={inputs[activeEntry.id]?.weight ?? ''} onChange={e => setInput(activeEntry.id, 'weight', e.target.value)} style={inputStyle} />
                  <input type="number" inputMode="numeric" placeholder="reps" value={inputs[activeEntry.id]?.reps ?? ''} onChange={e => setInput(activeEntry.id, 'reps', e.target.value)} style={inputStyle} />
                  <button onClick={() => handleAddSet(activeEntry.id)} style={{ padding: '11px 20px', flexShrink: 0, background: 'var(--accent)', color: '#fff', borderRadius: 'var(--r-md)', fontWeight: 700, fontSize: 15, transition: 'background 0.15s ease' }}>
                    Add
                  </button>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fixed bottom bar */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20, background: 'rgba(28,28,30,0.92)', backdropFilter: 'saturate(180%) blur(28px)', WebkitBackdropFilter: 'saturate(180%) blur(28px)', borderTop: '0.5px solid var(--hairline)' }}>
        <div className="forge-main" style={{ display: 'flex', gap: 10, padding: '12px 20px 28px' }}>
          <button onClick={openSearch} className="forge-btn-secondary" style={{ flex: 1, fontSize: 15 }}>
            <ForgeIcon name="plus" size={18} /> Exercise
          </button>
          <button onClick={handleFinish} className="forge-btn-primary" style={{ flex: 2 }}>
            Finish Workout
          </button>
        </div>
      </div>

      {/* Search modal */}
      {showSearch && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={closeSearch}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 540, background: 'var(--surface-1)', borderRadius: '24px 24px 0 0', padding: '20px 20px 40px', border: '0.5px solid var(--hairline-strong)', boxShadow: '0 -8px 40px rgba(0,0,0,0.5)' }}>
            <div style={{ width: 36, height: 4, background: 'var(--surface-3)', borderRadius: 2, margin: '0 auto 20px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{showCustomForm ? 'New Exercise' : 'Add Exercise'}</h2>
              <button className="forge-icon-btn" onClick={closeSearch}><ForgeIcon name="close" size={18} /></button>
            </div>

            {!showCustomForm ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 'var(--r-md)', marginBottom: 12 }}>
                  <ForgeIcon name="search" size={16} color="var(--text-tertiary)" />
                  <input autoFocus type="text" placeholder="Search exercises…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 15, fontFamily: 'inherit' }} />
                </div>
                <div style={{ maxHeight: 280, overflowY: 'auto' }} className="no-scrollbar">
                  {searchResults.map(ex => (
                    <button key={ex.id} onClick={() => addExercise(ex)} style={{ width: '100%', textAlign: 'left', padding: '12px 8px', borderBottom: '0.5px solid var(--hairline)', display: 'flex', alignItems: 'center', gap: 12, borderRadius: 0 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <ExerciseIllustration name={illustrationFor(ex.name)} size={30} />
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, margin: 0, fontSize: 15 }}>{ex.name}</p>
                        {ex.category && <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: '2px 0 0' }}>{ex.category}{ex.muscle_group ? ` · ${ex.muscle_group}` : ''}</p>}
                      </div>
                    </button>
                  ))}
                  {isLoadingExercises && (
                    <p style={{ color: 'var(--text-tertiary)', fontSize: 14, textAlign: 'center', padding: '24px 0 8px' }}>
                      Loading…
                    </p>
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
                <input autoFocus type="text" placeholder="Exercise name *" value={customName} onChange={e => setCustomName(e.target.value)} style={{ padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 'var(--r-md)', border: 'none', color: 'var(--text-primary)', fontSize: 15, fontFamily: 'inherit', outline: 'none' }} />
                <input type="text" placeholder="Category (e.g. Strength)" value={customCategory} onChange={e => setCustomCategory(e.target.value)} style={{ padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 'var(--r-md)', border: 'none', color: 'var(--text-primary)', fontSize: 15, fontFamily: 'inherit', outline: 'none' }} />
                <input type="text" placeholder="Muscle group (e.g. Chest)" value={customMuscleGroup} onChange={e => setCustomMuscleGroup(e.target.value)} style={{ padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 'var(--r-md)', border: 'none', color: 'var(--text-primary)', fontSize: 15, fontFamily: 'inherit', outline: 'none' }} />
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button onClick={() => setShowCustomForm(false)} className="forge-btn-secondary" style={{ flex: 1, fontSize: 15 }}>Back</button>
                  <button onClick={handleCreateCustom} disabled={!customName.trim()} className="forge-btn-primary" style={{ flex: 2, opacity: customName.trim() ? 1 : 0.45 }}>
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
