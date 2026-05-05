'use client'

import { useState } from 'react'
import { logMeasurement } from './actions'

const TYPE_UNITS: Record<string, string> = {
  bodyweight: 'kg',
  body_fat: '%',
  waist: 'cm',
  chest: 'cm',
  arms: 'cm',
}

const TYPES = ['bodyweight', 'body_fat', 'waist', 'chest', 'arms']

function typeLabel(t: string) {
  return t.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())
}

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
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  marginBottom: 6,
  display: 'block',
}

export default function MeasurementForm() {
  const today = new Date().toISOString().split('T')[0]
  const [type, setType] = useState('bodyweight')
  const [value, setValue] = useState('')
  const [date, setDate] = useState(today)
  const [submitting, setSubmitting] = useState(false)

  const unit = TYPE_UNITS[type]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const num = parseFloat(value)
    if (!num || !date) return
    setSubmitting(true)
    try {
      await logMeasurement(type, num, unit, date)
      setValue('')
      setDate(today)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{
      background: 'var(--surface-1)',
      borderRadius: 'var(--r-lg)',
      boxShadow: 'var(--shadow-card)',
      padding: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
    }}>
      <div>
        <label style={labelStyle}>Type</label>
        <select
          value={type}
          onChange={e => setType(e.target.value)}
          style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
        >
          {TYPES.map(t => (
            <option key={t} value={t}>{typeLabel(t)}</option>
          ))}
        </select>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Value ({unit})</label>
          <input
            type="number"
            step="0.1"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="e.g. 75.5"
            style={inputStyle}
            required
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            max={today}
            style={inputStyle}
            required
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="forge-btn-primary"
        style={{ opacity: submitting ? 0.5 : 1 }}
      >
        {submitting ? 'Logging...' : 'Log Measurement'}
      </button>
    </form>
  )
}
