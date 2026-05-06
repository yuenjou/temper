'use client'

import { useState } from 'react'
import { upsertDailyTargets } from './actions'

type GoalsData = {
  calories: number
  protein: number
  carbs: number
  fat: number
  goal_type: string | null
}

const DEFAULTS: GoalsData = { calories: 2000, protein: 150, carbs: 200, fat: 60, goal_type: 'maintain' }

const GOAL_TYPES = [
  { key: 'lose', label: 'Lose Weight' },
  { key: 'maintain', label: 'Maintain' },
  { key: 'gain', label: 'Gain Muscle' },
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
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--text-tertiary)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  marginBottom: 6,
  display: 'block',
}

export default function GoalsCard({ goals }: { goals: GoalsData | null }) {
  const current = goals ?? DEFAULTS
  const isDefault = !goals

  const [editing, setEditing] = useState(false)
  const [calories, setCalories] = useState(String(current.calories))
  const [protein, setProtein] = useState(String(current.protein))
  const [carbs, setCarbs] = useState(String(current.carbs))
  const [fat, setFat] = useState(String(current.fat))
  const [goalType, setGoalType] = useState(current.goal_type ?? 'maintain')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await upsertDailyTargets({
        calories: parseFloat(calories) || DEFAULTS.calories,
        protein: parseFloat(protein) || DEFAULTS.protein,
        carbs: parseFloat(carbs) || DEFAULTS.carbs,
        fat: parseFloat(fat) || DEFAULTS.fat,
        goal_type: goalType,
      })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setCalories(String(current.calories))
    setProtein(String(current.protein))
    setCarbs(String(current.carbs))
    setFat(String(current.fat))
    setGoalType(current.goal_type ?? 'maintain')
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="forge-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{ fontWeight: 600, fontSize: 15, margin: 0 }}>Goals</p>

        {/* Goal type */}
        <div>
          <label style={labelStyle}>Goal</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {GOAL_TYPES.map(g => (
              <button
                key={g.key}
                type="button"
                onClick={() => setGoalType(g.key)}
                style={{
                  padding: '8px 6px',
                  borderRadius: 'var(--r-md)',
                  fontSize: 13,
                  fontWeight: 600,
                  background: goalType === g.key ? 'var(--accent)' : 'var(--surface-2)',
                  color: goalType === g.key ? '#fff' : 'var(--text-secondary)',
                  transition: 'background 0.15s ease, color 0.15s ease',
                }}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Calories */}
        <div>
          <label style={labelStyle}>Daily Calories (kcal)</label>
          <input
            type="number"
            inputMode="decimal"
            value={calories}
            onChange={e => setCalories(e.target.value)}
            placeholder="2000"
            min={0}
            style={inputStyle}
          />
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: '6px 0 0' }}>
            Not sure?{' '}
            <span
              onClick={() => window.open('https://www.google.com/search?q=TDEE+calculator', '_blank')}
              style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 500 }}
            >
              Search TDEE calculator
            </span>
          </p>
        </div>

        {/* Macros */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[
            { label: 'Protein (g)', value: protein, set: setProtein, color: 'var(--green)' },
            { label: 'Carbs (g)', value: carbs, set: setCarbs, color: 'var(--orange)' },
            { label: 'Fat (g)', value: fat, set: setFat, color: 'var(--blue)' },
          ].map(({ label, value, set, color }) => (
            <div key={label}>
              <label style={{ ...labelStyle, color }}>{label}</label>
              <input
                type="number"
                inputMode="decimal"
                value={value}
                onChange={e => set(e.target.value)}
                placeholder="0"
                min={0}
                style={inputStyle}
              />
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            className="forge-btn-primary"
            style={{ flex: 1, opacity: saving ? 0.5 : 1 }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={handleCancel}
            style={{
              flex: 1,
              background: 'var(--surface-2)',
              border: '0.5px solid var(--hairline-strong)',
              borderRadius: 'var(--r-md)',
              padding: '10px 14px',
              fontSize: 15,
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  const goalLabel = GOAL_TYPES.find(g => g.key === (current.goal_type ?? 'maintain'))?.label ?? 'Maintain'

  return (
    <div className="forge-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <p style={{ fontWeight: 600, fontSize: 15, margin: 0 }}>Goals</p>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: '3px 0 0' }}>{goalLabel}</p>
        </div>
        <button
          onClick={() => setEditing(true)}
          style={{
            background: 'var(--surface-2)',
            border: '0.5px solid var(--hairline-strong)',
            borderRadius: 'var(--r-md)',
            padding: '8px 14px',
            fontSize: 13,
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontWeight: 500,
          }}
        >
          Edit
        </button>
      </div>

      {isDefault && (
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: '0 0 12px', padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 'var(--r-md)' }}>
          Using default targets — tap Edit to set your own.
        </p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {[
          { label: 'Calories', value: current.calories, unit: 'kcal', color: 'var(--accent)' },
          { label: 'Protein', value: current.protein, unit: 'g', color: 'var(--green)' },
          { label: 'Carbs', value: current.carbs, unit: 'g', color: 'var(--orange)' },
          { label: 'Fat', value: current.fat, unit: 'g', color: 'var(--blue)' },
        ].map(({ label, value, unit, color }) => (
          <div
            key={label}
            style={{ background: 'var(--surface-2)', borderRadius: 'var(--r-md)', padding: '10px 8px', textAlign: 'center' }}
          >
            <p style={{ fontSize: 18, fontWeight: 700, margin: 0, color }}>
              {Math.round(value)}
            </p>
            <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-tertiary)', margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {unit}
            </p>
            <p style={{ fontSize: 10, color: 'var(--text-tertiary)', margin: '2px 0 0' }}>{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
