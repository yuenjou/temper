'use client'

import { useState, useRef, useEffect } from 'react'
import ForgeIcon from '@/components/ForgeIcon'
import { addFoodEntry, deleteFoodEntry, saveFavourite, deleteFavourite } from './actions'

// ─── Types ───────────────────────────────────────────────────────────────────

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks'

export type FoodEntry = {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  meal_type: MealType
  logged_at: string
}

export type FoodFavourite = {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

export type DailyTargets = {
  calories: number
  protein: number
  carbs: number
  fat: number
}

export type FoodRecent = {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

type Props = {
  entries: FoodEntry[]
  favourites: FoodFavourite[]
  targets: DailyTargets
  recents: FoodRecent[]
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MEALS: { key: MealType; label: string }[] = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'snacks', label: 'Snacks' },
]

const inputStyle: React.CSSProperties = {
  background: 'var(--surface-2)',
  border: '0.5px solid var(--hairline-strong)',
  borderRadius: 'var(--r-md)',
  padding: '10px 14px',
  fontSize: 15,
  color: 'var(--text-primary)',
  width: '100%',
  outline: 'none',
  fontFamily: 'inherit',
}

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--text-tertiary)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: 6,
  display: 'block',
}

// ─── FoodEntryRow ─────────────────────────────────────────────────────────────

function FoodEntryRow({ entry, onDelete }: { entry: FoodEntry; onDelete: () => void }) {
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

    const next = Math.min(0, Math.max(-DELETE_W, baseOffset.current + dx))
    setOffset(next)
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

  const hasMacros = entry.protein > 0 || entry.carbs > 0 || entry.fat > 0

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderBottom: '0.5px solid var(--hairline)' }}>
      {/* Delete zone */}
      <div
        role="button"
        aria-label="Delete entry"
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
        style={{
          transform: `translateX(${offset}px)`,
          transition: dragging ? 'none' : 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
          background: 'var(--surface-1)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px',
          userSelect: 'none',
          touchAction: 'pan-y',
          WebkitUserSelect: 'none',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {entry.name}
          </p>
          {hasMacros && (
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-tertiary)' }}>
              P {Math.round(entry.protein)}g · C {Math.round(entry.carbs)}g · F {Math.round(entry.fat)}g
            </p>
          )}
        </div>
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', marginLeft: 12, flexShrink: 0 }}>
          {Math.round(entry.calories)} kcal
        </span>
      </div>
    </div>
  )
}

// ─── NutritionStrip ───────────────────────────────────────────────────────────

type NutritionStripProps = {
  total: { calories: number; protein: number; carbs: number; fat: number }
  targets: DailyTargets
  expanded: boolean
  onToggle: () => void
}

function NutritionStrip({ total, targets, expanded, onToggle }: NutritionStripProps) {
  const over = total.calories > targets.calories
  const diff = Math.abs(targets.calories - total.calories)

  const macros = [
    { label: 'Protein', key: 'protein' as const, value: total.protein, target: targets.protein, color: 'var(--green)', short: 'P' },
    { label: 'Carbs', key: 'carbs' as const, value: total.carbs, target: targets.carbs, color: 'var(--orange)', short: 'C' },
    { label: 'Fat', key: 'fat' as const, value: total.fat, target: targets.fat, color: 'var(--blue)', short: 'F' },
  ]

  return (
    <section style={{ padding: '0 20px 24px' }}>
      <button
        onClick={onToggle}
        style={{ width: '100%', display: 'block', textAlign: 'left' }}
        aria-expanded={expanded}
      >
        <div
          className="forge-card"
          style={{
            background: 'linear-gradient(135deg, rgba(255,59,48,0.06) 0%, var(--surface-1) 100%)',
            border: '0.5px solid rgba(255,59,48,0.15)',
          }}
        >
          {/* Compact row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ForgeIcon name="flame" size={16} color={over ? 'var(--orange)' : 'var(--accent)'} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 26, fontWeight: 700, margin: 0, lineHeight: 1.1, color: over ? 'var(--orange)' : 'var(--text-primary)' }}>
                {Math.round(diff).toLocaleString()}
              </p>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                kcal {over ? 'over budget' : 'remaining'}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {macros.map(m => (
                <div
                  key={m.key}
                  style={{ background: 'var(--surface-2)', borderRadius: 'var(--r-sm)', padding: '4px 7px', textAlign: 'center' }}
                >
                  <p style={{ fontSize: 13, fontWeight: 700, margin: 0, color: m.color, lineHeight: 1.2 }}>
                    {Math.round(m.value)}g
                  </p>
                  <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-tertiary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {m.short}
                  </p>
                </div>
              ))}
              <div style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', paddingLeft: 2 }}>
                <ForgeIcon name="chevron-down" size={14} color="var(--text-tertiary)" />
              </div>
            </div>
          </div>

          {/* Expanded macro bars */}
          {expanded && (
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ paddingTop: 2, borderTop: '0.5px solid var(--hairline)' }} />
              {[
                { label: 'Calories', value: total.calories, target: targets.calories, unit: 'kcal', color: 'var(--accent)' },
                ...macros.map(m => ({ label: m.label, value: m.value, target: m.target, unit: 'g', color: m.color })),
              ].map(({ label, value, target, unit, color }) => {
                const pct = Math.min(value / (target || 1), 1)
                const isOver = value > target
                return (
                  <div key={label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                        {Math.round(value)} / {Math.round(target)} {unit}
                      </span>
                    </div>
                    <div style={{ height: 5, borderRadius: 3, background: 'var(--surface-2)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${pct * 100}%`,
                        background: isOver ? 'var(--orange)' : color,
                        borderRadius: 3,
                        transition: 'width 0.4s ease',
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </button>
    </section>
  )
}

// ─── MealCard ─────────────────────────────────────────────────────────────────

type MealCardProps = {
  meal: { key: MealType; label: string }
  entries: FoodEntry[]
  onAdd: (meal: MealType) => void
  onDelete: (id: string) => void
}

function MealCard({ meal, entries, onAdd, onDelete }: MealCardProps) {
  const [collapsed, setCollapsed] = useState(false)
  const mealTotal = entries.reduce((s, e) => s + Number(e.calories), 0)

  return (
    <div style={{ marginBottom: 12 }}>
      {/* Meal header */}
      <button
        onClick={() => setCollapsed(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 4px 8px', textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {meal.label}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {mealTotal > 0 && (
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)' }}>
              {Math.round(mealTotal)} kcal
            </span>
          )}
          <div style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
            <ForgeIcon name="chevron-down" size={14} color="var(--text-tertiary)" />
          </div>
        </div>
      </button>

      {/* Meal content */}
      {!collapsed && (
        <div className="forge-card-flush">
          {entries.map(entry => (
            <FoodEntryRow
              key={entry.id}
              entry={entry}
              onDelete={() => onDelete(entry.id)}
            />
          ))}
          {/* Add food row */}
          <button
            onClick={() => onAdd(meal.key)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 16px', textAlign: 'left',
            }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <ForgeIcon name="plus" size={14} color="var(--accent)" />
            </div>
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--accent)' }}>Add food</span>
          </button>
        </div>
      )}
    </div>
  )
}

// ─── WaterTracker ─────────────────────────────────────────────────────────────

function WaterTracker() {
  const [glasses, setGlasses] = useState(0)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const longPressFired = useRef(false)

  useEffect(() => {
    const today = new Date().toLocaleDateString('en-CA')
    const stored = localStorage.getItem(`water_${today}`)
    if (stored) setGlasses(parseInt(stored, 10))
  }, [])

  function save(n: number) {
    const today = new Date().toLocaleDateString('en-CA')
    localStorage.setItem(`water_${today}`, String(n))
    setGlasses(n)
  }

  function increment() { save(glasses + 1) }
  function decrement() { save(Math.max(0, glasses - 1)) }

  function handlePointerDown() {
    longPressFired.current = false
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true
      decrement()
    }, 600)
  }

  function handlePointerUp() {
    clearTimeout(longPressTimer.current)
  }

  function handleClick() {
    if (!longPressFired.current) increment()
  }

  const filled = Math.min(glasses, 8)

  return (
    <section style={{ padding: '0 20px 24px' }}>
      <div className="forge-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ForgeIcon name="water" size={16} color="var(--blue)" />
            <span className="forge-eyebrow">Water</span>
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>
            {glasses} <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>/ 8</span>
          </span>
        </div>

        {/* Glass indicators */}
        <div style={{ display: 'flex', gap: 5, marginBottom: 14 }}>
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={i}
              style={{
                flex: 1, height: 34, borderRadius: 6,
                background: i < filled ? 'var(--blue)' : 'var(--surface-2)',
                transition: 'background 0.15s ease',
                position: 'relative', overflow: 'hidden',
              }}
            >
              {i < filled && (
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%',
                  background: 'rgba(255,255,255,0.12)',
                }} />
              )}
            </div>
          ))}
        </div>

        <button
          className="forge-btn-secondary"
          style={{ fontSize: 14, padding: '11px 20px', gap: 8 }}
          onClick={handleClick}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <ForgeIcon name="plus" size={15} color="var(--blue)" />
          <span style={{ color: 'var(--text-primary)' }}>Add glass</span>
          <span style={{ color: 'var(--text-tertiary)', fontSize: 12, marginLeft: 'auto' }}>Hold to remove</span>
        </button>
      </div>
    </section>
  )
}

// ─── FoodListItem (sheet results) ─────────────────────────────────────────────

function FoodListItem({
  food,
  onSelect,
  onDelete,
  showDelete,
}: {
  food: { name: string; calories: number; protein: number; carbs: number; fat: number }
  onSelect: () => void
  onDelete?: () => void
  showDelete?: boolean
}) {
  const hasMacros = food.protein > 0 || food.carbs > 0 || food.fat > 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '0.5px solid var(--hairline)' }}>
      <button onClick={onSelect} style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 600, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {food.name}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-tertiary)' }}>
          {Math.round(food.calories)} kcal
          {hasMacros && ` · P${Math.round(food.protein)} C${Math.round(food.carbs)} F${Math.round(food.fat)}`}
        </p>
      </button>
      {showDelete && onDelete && (
        <button
          onClick={onDelete}
          style={{ flexShrink: 0, width: 28, height: 28, borderRadius: '50%', background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ForgeIcon name="close" size={12} color="var(--text-tertiary)" />
        </button>
      )}
      {!showDelete && (
        <div style={{ flexShrink: 0 }}>
          <ForgeIcon name="plus" size={16} color="var(--text-tertiary)" />
        </div>
      )}
    </div>
  )
}

// ─── FoodClient (main) ────────────────────────────────────────────────────────

export default function FoodClient({ entries: initialEntries, favourites: initialFavourites, targets, recents }: Props) {
  // Data state
  const [entries, setEntries] = useState<FoodEntry[]>(initialEntries)
  const [favourites, setFavourites] = useState<FoodFavourite[]>(initialFavourites)

  // UI state
  const [macrosExpanded, setMacrosExpanded] = useState(false)

  // Sheet state
  const [sheetMounted, setSheetMounted] = useState(false)
  const [sheetVisible, setSheetVisible] = useState(false)
  const [sheetMeal, setSheetMeal] = useState<MealType>('breakfast')

  // Form state
  const [activeTab, setActiveTab] = useState<'recents' | 'favourites'>('recents')
  const [search, setSearch] = useState('')
  const [formName, setFormName] = useState('')
  const [formCalories, setFormCalories] = useState('')
  const [formProtein, setFormProtein] = useState('')
  const [formCarbs, setFormCarbs] = useState('')
  const [formFat, setFormFat] = useState('')
  const [showMacros, setShowMacros] = useState(false)
  const [saveToFavs, setSaveToFavs] = useState(false)
  const [saving, setSaving] = useState(false)

  const searchRef = useRef<HTMLInputElement>(null)

  // Sync server → client on re-render after revalidatePath
  useEffect(() => { setEntries(initialEntries) }, [initialEntries])
  useEffect(() => { setFavourites(initialFavourites) }, [initialFavourites])

  // Body scroll lock when sheet open
  useEffect(() => {
    document.body.style.overflow = sheetMounted ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [sheetMounted])

  // Autofocus search when sheet slides in
  useEffect(() => {
    if (sheetVisible) {
      const t = setTimeout(() => searchRef.current?.focus(), 80)
      return () => clearTimeout(t)
    }
  }, [sheetVisible])

  // ── Computed ──────────────────────────────────────────────────────────────

  const total = {
    calories: entries.reduce((s, e) => s + Number(e.calories), 0),
    protein: entries.reduce((s, e) => s + Number(e.protein), 0),
    carbs: entries.reduce((s, e) => s + Number(e.carbs), 0),
    fat: entries.reduce((s, e) => s + Number(e.fat), 0),
  }

  const listSource = activeTab === 'recents' ? recents : favourites
  const filteredList = search
    ? listSource.filter(item => item.name.toLowerCase().includes(search.toLowerCase()))
    : listSource

  // ── Handlers ──────────────────────────────────────────────────────────────

  function openSheet(meal: MealType) {
    setSheetMeal(meal)
    setSearch('')
    setFormName(''); setFormCalories(''); setFormProtein(''); setFormCarbs(''); setFormFat('')
    setShowMacros(false); setSaveToFavs(false)
    setActiveTab('recents')
    setSheetMounted(true)
    requestAnimationFrame(() => requestAnimationFrame(() => setSheetVisible(true)))
  }

  function closeSheet() {
    setSheetVisible(false)
    setTimeout(() => setSheetMounted(false), 350)
  }

  function fillFood(food: FoodRecent | FoodFavourite) {
    setFormName(food.name)
    setFormCalories(String(Math.round(food.calories)))
    setFormProtein(food.protein > 0 ? String(Math.round(food.protein)) : '')
    setFormCarbs(food.carbs > 0 ? String(Math.round(food.carbs)) : '')
    setFormFat(food.fat > 0 ? String(Math.round(food.fat)) : '')
    if (food.protein > 0 || food.carbs > 0 || food.fat > 0) setShowMacros(true)
    setSearch('')
  }

  function handleDelete(id: string) {
    setEntries(prev => prev.filter(e => e.id !== id))
    deleteFoodEntry(id).catch(() => {
      // revert on failure
      setEntries(initialEntries)
    })
  }

  function handleDeleteFavourite(id: string) {
    setFavourites(prev => prev.filter(f => f.id !== id))
    deleteFavourite(id).catch(() => {
      setFavourites(initialFavourites)
    })
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const name = formName.trim()
    const calories = parseFloat(formCalories)
    if (!name || !calories || isNaN(calories)) return
    setSaving(true)

    const entryData = {
      name,
      calories,
      protein: parseFloat(formProtein || '0') || 0,
      carbs: parseFloat(formCarbs || '0') || 0,
      fat: parseFloat(formFat || '0') || 0,
      meal_type: sheetMeal,
    }

    const tempEntry: FoodEntry = { id: `temp_${Date.now()}`, ...entryData, logged_at: new Date().toISOString() }
    setEntries(prev => [...prev, tempEntry])
    closeSheet()
    setSaving(false)

    try {
      await addFoodEntry(entryData)
      if (saveToFavs) {
        const { meal_type: _mt, ...favData } = entryData
        await saveFavourite(favData)
      }
    } catch {
      setEntries(prev => prev.filter(e => e.id !== tempEntry.id))
    }
  }

  const mealLabel = MEALS.find(m => m.key === sheetMeal)?.label ?? ''

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Header */}
      <section style={{ padding: '20px 24px 20px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0 }}>Food</h1>
      </section>

      {/* Nutrition strip */}
      <NutritionStrip
        total={total}
        targets={targets}
        expanded={macrosExpanded}
        onToggle={() => setMacrosExpanded(v => !v)}
      />

      {/* Meals */}
      <section style={{ padding: '0 20px 24px' }}>
        <p className="forge-eyebrow" style={{ marginBottom: 14 }}>Meals</p>
        {MEALS.map(meal => (
          <MealCard
            key={meal.key}
            meal={meal}
            entries={entries.filter(e => e.meal_type === meal.key)}
            onAdd={openSheet}
            onDelete={handleDelete}
          />
        ))}
      </section>

      {/* Water */}
      <WaterTracker />

      {/* Add Food Sheet */}
      {sheetMounted && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
          {/* Backdrop */}
          <div
            onClick={closeSheet}
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(2px)',
              opacity: sheetVisible ? 1 : 0,
              transition: 'opacity 0.3s ease',
            }}
          />

          {/* Sheet panel */}
          <div
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'var(--surface-1)',
              borderRadius: '20px 20px 0 0',
              maxHeight: '92dvh',
              display: 'flex', flexDirection: 'column',
              transform: sheetVisible ? 'translateY(0)' : 'translateY(100%)',
              transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
              boxShadow: '0 -4px 40px rgba(0,0,0,0.4)',
            }}
          >
            {/* Drag handle */}
            <div style={{ padding: '12px 0 0', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
              <div style={{ width: 36, height: 4, background: 'var(--surface-3)', borderRadius: 2 }} />
            </div>

            {/* Header */}
            <div style={{ padding: '14px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Add to {mealLabel}</h2>
              <button onClick={closeSheet} className="forge-icon-btn">
                <ForgeIcon name="close" size={18} />
              </button>
            </div>

            {/* Search */}
            <div style={{ padding: '14px 20px 0', flexShrink: 0 }}>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <ForgeIcon name="search" size={16} color="var(--text-tertiary)" />
                </div>
                <input
                  ref={searchRef}
                  type="search"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search foods..."
                  autoComplete="off"
                  style={{ ...inputStyle, paddingLeft: 38 }}
                />
              </div>
            </div>

            {/* Tabs */}
            <div style={{ padding: '12px 20px 0', display: 'flex', gap: 6, flexShrink: 0 }}>
              {(['recents', 'favourites'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '6px 14px', borderRadius: 'var(--r-pill)', fontSize: 13, fontWeight: 600,
                    background: activeTab === tab ? 'var(--accent)' : 'var(--surface-2)',
                    color: activeTab === tab ? '#fff' : 'var(--text-secondary)',
                    transition: 'background 0.15s ease, color 0.15s ease',
                  }}
                >
                  {tab === 'recents' ? 'Recent' : 'Favourites'}
                </button>
              ))}
            </div>

            {/* Scrollable content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 32px' }} className="no-scrollbar">

              {/* Results list */}
              {filteredList.length > 0 ? (
                <div style={{ paddingTop: 4 }}>
                  {filteredList.map((item, i) => (
                    <FoodListItem
                      key={`${activeTab}-${i}`}
                      food={item}
                      onSelect={() => fillFood(item)}
                      onDelete={activeTab === 'favourites' ? () => handleDeleteFavourite((item as FoodFavourite).id) : undefined}
                      showDelete={activeTab === 'favourites'}
                    />
                  ))}
                </div>
              ) : search ? (
                <p style={{ fontSize: 14, color: 'var(--text-tertiary)', padding: '14px 0 8px', margin: 0 }}>
                  No matches — enter manually below
                </p>
              ) : (
                <p style={{ fontSize: 14, color: 'var(--text-tertiary)', padding: '14px 0 8px', margin: 0 }}>
                  {activeTab === 'recents' ? 'No recent foods yet' : 'No saved favourites yet'}
                </p>
              )}

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0' }}>
                <div style={{ flex: 1, height: '0.5px', background: 'var(--hairline)' }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Manual entry
                </span>
                <div style={{ flex: 1, height: '0.5px', background: 'var(--hairline)' }} />
              </div>

              {/* Form */}
              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Name */}
                <div>
                  <label style={labelStyle}>Name *</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="e.g. Chicken rice"
                    style={inputStyle}
                    required
                    autoComplete="off"
                  />
                </div>

                {/* Calories */}
                <div>
                  <label style={labelStyle}>Calories (kcal) *</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={formCalories}
                    onChange={e => setFormCalories(e.target.value)}
                    placeholder="e.g. 350"
                    style={inputStyle}
                    required
                    min={0}
                  />
                </div>

                {/* Macros toggle */}
                <button
                  type="button"
                  onClick={() => setShowMacros(v => !v)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500,
                    paddingBottom: 2,
                  }}
                >
                  <div style={{ transform: showMacros ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.18s ease' }}>
                    <ForgeIcon name="chevron-right" size={14} color="var(--text-tertiary)" />
                  </div>
                  Protein / Carbs / Fat
                </button>

                {showMacros && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    {[
                      { key: 'protein', label: 'Protein (g)', value: formProtein, set: setFormProtein, color: 'var(--green)' },
                      { key: 'carbs', label: 'Carbs (g)', value: formCarbs, set: setFormCarbs, color: 'var(--orange)' },
                      { key: 'fat', label: 'Fat (g)', value: formFat, set: setFormFat, color: 'var(--blue)' },
                    ].map(({ key, label, value, set, color }) => (
                      <div key={key}>
                        <label style={{ ...labelStyle, color }}>{label}</label>
                        <input
                          type="number"
                          inputMode="decimal"
                          value={value}
                          onChange={e => set(e.target.value)}
                          placeholder="0"
                          style={inputStyle}
                          min={0}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Meal type selector */}
                <div>
                  <label style={labelStyle}>Meal</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                    {MEALS.map(m => (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => setSheetMeal(m.key)}
                        style={{
                          padding: '8px 4px', borderRadius: 'var(--r-md)', fontSize: 12, fontWeight: 600,
                          background: sheetMeal === m.key ? 'var(--accent)' : 'var(--surface-2)',
                          color: sheetMeal === m.key ? '#fff' : 'var(--text-secondary)',
                          transition: 'background 0.15s ease, color 0.15s ease',
                        }}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Save to favourites toggle */}
                <button
                  type="button"
                  onClick={() => setSaveToFavs(v => !v)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px',
                    background: saveToFavs ? 'rgba(255,159,10,0.1)' : 'var(--surface-2)',
                    borderRadius: 'var(--r-md)',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <ForgeIcon name="heart" size={16} color={saveToFavs ? 'var(--orange)' : 'var(--text-tertiary)'} />
                  <span style={{ fontSize: 14, fontWeight: 500, color: saveToFavs ? 'var(--orange)' : 'var(--text-secondary)' }}>
                    Save to favourites
                  </span>
                  <div style={{
                    marginLeft: 'auto', width: 20, height: 20, borderRadius: '50%',
                    background: saveToFavs ? 'var(--orange)' : 'var(--surface-3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.15s ease',
                  }}>
                    {saveToFavs && <ForgeIcon name="check" size={11} color="#fff" strokeWidth={2.5} />}
                  </div>
                </button>

                {/* Submit */}
                <button
                  type="submit"
                  className="forge-btn-primary"
                  disabled={saving || !formName.trim() || !formCalories}
                  style={{ opacity: saving || !formName.trim() || !formCalories ? 0.5 : 1 }}
                >
                  {saving ? 'Adding...' : `Add to ${mealLabel}`}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
