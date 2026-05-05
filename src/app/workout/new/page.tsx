'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  createWorkout,
  finishWorkout,
  searchExercises,
  createCustomExercise,
  logSet,
  deleteSet,
} from './actions'

type WorkoutSet = { id: string; reps: number; weight: number; weight_unit: string }
type Exercise = { id: string; name: string; category: string; muscle_group: string }
type ExerciseEntry = Exercise & { sets: WorkoutSet[] }

export default function NewWorkoutPage() {
  const router = useRouter()
  const [workoutId, setWorkoutId] = useState<string | null>(null)
  const [entries, setEntries] = useState<ExerciseEntry[]>([])
  const [inputs, setInputs] = useState<Record<string, { reps: string; weight: string }>>({})

  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Exercise[]>([])
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customCategory, setCustomCategory] = useState('')
  const [customMuscleGroup, setCustomMuscleGroup] = useState('')

  useEffect(() => {
    createWorkout().then(w => setWorkoutId(w.id))
  }, [])

  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return }
    const t = setTimeout(() => { searchExercises(searchQuery).then(setSearchResults) }, 300)
    return () => clearTimeout(t)
  }, [searchQuery])

  function addExercise(ex: Exercise) {
    if (entries.some(e => e.id === ex.id)) { closeSearch(); return }
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
    if (!workoutId) return
    const { reps: repsStr, weight: weightStr } = inputs[exerciseId] ?? {}
    const reps = parseInt(repsStr)
    const weight = parseFloat(weightStr)
    if (!reps || !weight) return

    const set = await logSet(workoutId, exerciseId, reps, weight)
    setEntries(prev => prev.map(e => e.id === exerciseId ? { ...e, sets: [...e.sets, set] } : e))
    setInputs(prev => ({ ...prev, [exerciseId]: { reps: '', weight: '' } }))
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
    addExercise(ex)
    setCustomName(''); setCustomCategory(''); setCustomMuscleGroup('')
  }

  async function handleFinish() {
    if (!workoutId) return
    await finishWorkout(workoutId)
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">New Workout</h1>
        <button
          onClick={handleFinish}
          disabled={!workoutId}
          className="bg-green-600 hover:bg-green-500 disabled:opacity-40 px-4 py-2 rounded font-medium"
        >
          Finish Workout
        </button>
      </div>

      {!workoutId && <p className="text-zinc-400 text-sm mb-4">Starting workout...</p>}

      <div className="space-y-4">
        {entries.map(entry => (
          <div key={entry.id} className="border border-zinc-700 rounded-lg p-4">
            <h2 className="font-semibold mb-1">{entry.name}</h2>
            {entry.category && (
              <p className="text-zinc-400 text-xs mb-3">{entry.category}{entry.muscle_group ? ` · ${entry.muscle_group}` : ''}</p>
            )}

            {entry.sets.length > 0 && (
              <table className="w-full text-sm mb-3">
                <thead>
                  <tr className="text-zinc-500 text-left">
                    <th className="pb-1 w-8">#</th>
                    <th className="pb-1">Reps</th>
                    <th className="pb-1">Weight</th>
                    <th className="pb-1"></th>
                  </tr>
                </thead>
                <tbody>
                  {entry.sets.map((s, i) => (
                    <tr key={s.id} className="border-t border-zinc-800">
                      <td className="py-1 text-zinc-500">{i + 1}</td>
                      <td className="py-1">{s.reps}</td>
                      <td className="py-1">{s.weight} {s.weight_unit}</td>
                      <td className="py-1 text-right">
                        <button
                          onClick={() => handleDeleteSet(entry.id, s.id)}
                          className="text-red-500 hover:text-red-400 text-xs"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Reps"
                value={inputs[entry.id]?.reps ?? ''}
                onChange={e => setInput(entry.id, 'reps', e.target.value)}
                className="w-20 bg-zinc-800 rounded px-2 py-1.5 text-sm"
              />
              <input
                type="number"
                placeholder="kg"
                value={inputs[entry.id]?.weight ?? ''}
                onChange={e => setInput(entry.id, 'weight', e.target.value)}
                className="w-20 bg-zinc-800 rounded px-2 py-1.5 text-sm"
              />
              <button
                onClick={() => handleAddSet(entry.id)}
                className="bg-zinc-700 hover:bg-zinc-600 px-3 py-1.5 rounded text-sm"
              >
                + Add Set
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setShowSearch(true)}
        className="mt-4 w-full border border-dashed border-zinc-600 hover:border-zinc-400 text-zinc-400 hover:text-white py-3 rounded-lg text-sm"
      >
        + Add Exercise
      </button>

      {showSearch && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold">{showCustomForm ? 'New Exercise' : 'Add Exercise'}</h2>
              <button onClick={closeSearch} className="text-zinc-400 hover:text-white">✕</button>
            </div>

            {!showCustomForm ? (
              <>
                <input
                  autoFocus
                  type="text"
                  placeholder="Search exercises (min 2 chars)"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-800 rounded px-3 py-2 text-sm mb-2"
                />
                <div className="max-h-64 overflow-y-auto space-y-0.5">
                  {searchResults.map(ex => (
                    <button
                      key={ex.id}
                      onClick={() => addExercise(ex)}
                      className="w-full text-left px-3 py-2 hover:bg-zinc-800 rounded text-sm"
                    >
                      <span className="font-medium">{ex.name}</span>
                      {ex.category && <span className="text-zinc-500 ml-2">{ex.category}</span>}
                    </button>
                  ))}
                  {searchQuery.length >= 2 && searchResults.length === 0 && (
                    <div className="text-center py-6">
                      <p className="text-zinc-400 text-sm mb-3">No exercises found</p>
                      <button
                        onClick={() => setShowCustomForm(true)}
                        className="text-blue-400 hover:text-blue-300 text-sm underline"
                      >
                        Create &quot;{searchQuery}&quot; as custom
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <input
                  autoFocus
                  type="text"
                  placeholder="Exercise name *"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  className="w-full bg-zinc-800 rounded px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  placeholder="Category (e.g. Strength)"
                  value={customCategory}
                  onChange={e => setCustomCategory(e.target.value)}
                  className="w-full bg-zinc-800 rounded px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  placeholder="Muscle group (e.g. Chest)"
                  value={customMuscleGroup}
                  onChange={e => setCustomMuscleGroup(e.target.value)}
                  className="w-full bg-zinc-800 rounded px-3 py-2 text-sm"
                />
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setShowCustomForm(false)}
                    className="flex-1 border border-zinc-600 py-2 rounded text-sm"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCreateCustom}
                    disabled={!customName.trim()}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 py-2 rounded text-sm font-medium"
                  >
                    Create &amp; Add
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
