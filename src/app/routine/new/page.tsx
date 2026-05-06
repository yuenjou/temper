'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import ExerciseIllustration from '@/components/ExerciseIllustration'
import ForgeIcon from '@/components/ForgeIcon'
import { getAllExercises, createCustomExercise } from '@/app/workout/new/actions'
import { getCached, setCached, appendCached, filterCached } from '@/lib/exercise-cache'
import { createRoutine } from '@/app/routine/actions'

type Exercise = { id: string; name: string; category: string; muscle_group: string }
type PlannedSet = { reps: number; weight: number; weight_unit: string }

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

export default function NewRoutinePage() {
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState('')
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [plannedSets, setPlannedSets] = useState<Record<string, PlannedSet[]>>({})
  const [setInputs, setSetInputs] = useState<Record<string, { reps: string; weight: string }>>({})

  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Exercise[]>([])
  const [isLoadingExercises, setIsLoadingExercises] = useState(false)
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customCategory, setCustomCategory] = useState('')
  const [customMuscleGroup, setCustomMuscleGroup] = useState('')

  async function openSearch() {
    setShowSearch(true)
    setSearchQuery('')
    setSearchResults([])
    setShowCustomForm(false)
    if (!getCached()) {
      setIsLoadingExercises(true)
      const exercises = await getAllExercises()
      setCached(exercises)
      setIsLoadingExercises(false)
    }
  }

  function closeSearch() {
    setShowSearch(false)
    setShowCustomForm(false)
    setSearchQuery('')
    setSearchResults([])
  }

  useEffect(() => {
    setSearchResults(filterCached(searchQuery))
  }, [searchQuery])

  function addExercise(ex: Exercise) {
    if (!exercises.some(e => e.id === ex.id)) {
      setExercises(prev => [...prev, ex])
      setSetInputs(prev => ({ ...prev, [ex.id]: { reps: '', weight: '' } }))
    }
    closeSearch()
  }

  function removeExercise(id: string) {
    setExercises(prev => prev.filter(e => e.id !== id))
    setPlannedSets(prev => { const n = { ...prev }; delete n[id]; return n })
    setSetInputs(prev => { const n = { ...prev }; delete n[id]; return n })
  }

  function handleAddPlannedSet(exerciseId: string) {
    const { reps: repsStr, weight: weightStr } = setInputs[exerciseId] ?? {}
    const reps = parseInt(repsStr)
    const weight = parseFloat(weightStr)
    if (!reps || !weight) return
    setPlannedSets(prev => ({
      ...prev,
      [exerciseId]: [...(prev[exerciseId] ?? []), { reps, weight, weight_unit: 'kg' }],
    }))
    setSetInputs(prev => ({ ...prev, [exerciseId]: { reps: '', weight: '' } }))
  }

  function removePlannedSet(exerciseId: string, index: number) {
    setPlannedSets(prev => ({
      ...prev,
      [exerciseId]: prev[exerciseId].filter((_, i) => i !== index),
    }))
  }

  async function handleCreateCustom() {
    if (!customName.trim()) return
    const ex = await createCustomExercise(customName.trim(), customCategory.trim(), customMuscleGroup.trim())
    appendCached(ex)
    addExercise(ex)
    setCustomName(''); setCustomCategory(''); setCustomMuscleGroup('')
  }

  function handleSubmit() {
    if (!name.trim() || exercises.length === 0) return
    startTransition(async () => {
      await createRoutine(name.trim(), exercises.map(e => ({
        id: e.id,
        sets: plannedSets[e.id] ?? [],
      })))
    })
  }

  const canSubmit = name.trim().length > 0 && exercises.length > 0 && !isPending

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '14px 16px',
    background: 'var(--surface-2)', borderRadius: 'var(--r-md)',
    border: 'none', color: 'var(--text-primary)',
    fontSize: 16, fontFamily: 'inherit', outline: 'none',
  }

  const setInputStyle: React.CSSProperties = {
    flex: 1, padding: '9px 12px',
    background: 'var(--surface-2)', borderRadius: 'var(--r-md)',
    border: 'none', color: 'var(--text-primary)',
    fontSize: 14, fontWeight: 600, outline: 'none',
    fontFamily: 'inherit',
  }

  return (
    <>
      <main className="forge-main" style={{ minHeight: '100vh', paddingBottom: 120 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '0.5px solid var(--hairline)' }}>
          <Link href="/workout/new" style={{ textDecoration: 'none' }}>
            <button className="forge-icon-btn" aria-label="Back">
              <ForgeIcon name="chevron-left" size={20} />
            </button>
          </Link>
          <h1 style={{ flex: 1, fontSize: 18, fontWeight: 700, margin: 0, textAlign: 'center' }}>New Routine</h1>
          <div style={{ width: 36 }} />
        </div>

        <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Routine name */}
          <div>
            <p className="forge-eyebrow" style={{ marginBottom: 10 }}>Routine Name</p>
            <input
              type="text"
              placeholder="e.g. Push Day A"
              value={name}
              onChange={e => setName(e.target.value)}
              style={inputStyle}
              autoFocus
            />
          </div>

          {/* Exercises */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <p className="forge-eyebrow">Exercises</p>
              {exercises.length > 0 && (
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 500 }}>
                  {exercises.length} added
                </span>
              )}
            </div>

            {exercises.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 12 }}>
                {exercises.map((ex, i) => {
                  const sets = plannedSets[ex.id] ?? []
                  const inp = setInputs[ex.id] ?? { reps: '', weight: '' }
                  return (
                    <div key={ex.id} className="forge-card" style={{ padding: 0, overflow: 'hidden' }}>

                      {/* Exercise header */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <ExerciseIllustration name={illustrationFor(ex.name)} size={26} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 600, margin: 0, fontSize: 15 }}>{ex.name}</p>
                          {ex.category && (
                            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: '2px 0 0' }}>
                              {ex.category}{ex.muscle_group ? ` · ${ex.muscle_group}` : ''}
                            </p>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 500 }}>#{i + 1}</span>
                          <button
                            onClick={() => removeExercise(ex.id)}
                            style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}
                          >
                            <ForgeIcon name="close" size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Planned sets list */}
                      {sets.length > 0 && (
                        <>
                          <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 1fr 28px', gap: 8, padding: '6px 16px', borderTop: '0.5px solid var(--hairline)', fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <span>#</span><span>Weight</span><span>Reps</span><span />
                          </div>
                          {sets.map((s, j) => (
                            <div key={j} style={{ display: 'grid', gridTemplateColumns: '28px 1fr 1fr 28px', gap: 8, padding: '8px 16px', alignItems: 'center', borderTop: '0.5px solid var(--hairline)' }}>
                              <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                                {j + 1}
                              </div>
                              <span style={{ fontWeight: 600, fontSize: 14 }}>
                                {s.weight} <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 500 }}>kg</span>
                              </span>
                              <span style={{ fontWeight: 600, fontSize: 14 }}>
                                {s.reps} <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 500 }}>reps</span>
                              </span>
                              <button
                                onClick={() => removePlannedSet(ex.id, j)}
                                style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}
                              >
                                <ForgeIcon name="close" size={10} />
                              </button>
                            </div>
                          ))}
                        </>
                      )}

                      {/* Add set row */}
                      <div style={{ display: 'flex', gap: 8, padding: '10px 16px', borderTop: '0.5px solid var(--hairline)', alignItems: 'center' }}>
                        <input
                          type="number"
                          inputMode="decimal"
                          placeholder="kg"
                          value={inp.weight}
                          onChange={e => setSetInputs(prev => ({ ...prev, [ex.id]: { ...prev[ex.id], weight: e.target.value } }))}
                          onKeyDown={e => { if (e.key === 'Enter') handleAddPlannedSet(ex.id) }}
                          style={setInputStyle}
                        />
                        <input
                          type="number"
                          inputMode="numeric"
                          placeholder="reps"
                          value={inp.reps}
                          onChange={e => setSetInputs(prev => ({ ...prev, [ex.id]: { ...prev[ex.id], reps: e.target.value } }))}
                          onKeyDown={e => { if (e.key === 'Enter') handleAddPlannedSet(ex.id) }}
                          style={setInputStyle}
                        />
                        <button
                          onClick={() => handleAddPlannedSet(ex.id)}
                          style={{ padding: '9px 16px', flexShrink: 0, background: 'var(--surface-3)', color: 'var(--text-primary)', borderRadius: 'var(--r-md)', fontWeight: 700, fontSize: 13 }}
                        >
                          + Set
                        </button>
                      </div>

                    </div>
                  )
                })}
              </div>
            )}

            <button
              onClick={openSearch}
              style={{
                width: '100%', padding: '14px 20px',
                border: '1.5px dashed var(--surface-3)', borderRadius: 'var(--r-lg)',
                color: 'var(--text-tertiary)', fontSize: 15, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'border-color 0.15s ease, color 0.15s ease',
                cursor: 'pointer',
              }}
            >
              <ForgeIcon name="plus" size={18} />
              Add Exercise
            </button>
          </div>
        </div>
      </main>

      {/* Fixed save bar */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20, background: 'rgba(28,28,30,0.92)', backdropFilter: 'saturate(180%) blur(28px)', WebkitBackdropFilter: 'saturate(180%) blur(28px)', borderTop: '0.5px solid var(--hairline)' }}>
        <div className="forge-main" style={{ padding: '12px 20px 28px' }}>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="forge-btn-primary"
            style={{ opacity: canSubmit ? 1 : 0.4 }}
          >
            {isPending ? 'Saving…' : 'Save Routine'}
          </button>
        </div>
      </div>

      {/* Exercise search modal */}
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
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search exercises…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 15, fontFamily: 'inherit' }}
                  />
                </div>
                <div style={{ maxHeight: 300, overflowY: 'auto' }} className="no-scrollbar">
                  {searchResults.map(ex => {
                    const alreadyAdded = exercises.some(e => e.id === ex.id)
                    return (
                      <button
                        key={ex.id}
                        onClick={() => addExercise(ex)}
                        disabled={alreadyAdded}
                        style={{ width: '100%', textAlign: 'left', padding: '12px 8px', borderBottom: '0.5px solid var(--hairline)', display: 'flex', alignItems: 'center', gap: 12, borderRadius: 0, opacity: alreadyAdded ? 0.4 : 1 }}
                      >
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <ExerciseIllustration name={illustrationFor(ex.name)} size={30} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 600, margin: 0, fontSize: 15 }}>{ex.name}</p>
                          {ex.category && <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: '2px 0 0' }}>{ex.category}{ex.muscle_group ? ` · ${ex.muscle_group}` : ''}</p>}
                        </div>
                        {alreadyAdded && <ForgeIcon name="check" size={16} color="var(--green)" />}
                      </button>
                    )
                  })}
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
