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
    <form onSubmit={handleSubmit} className="border border-zinc-700 rounded-lg p-4 mb-8 space-y-3">
      <div className="flex flex-col gap-1">
        <label className="text-sm text-zinc-400">Type</label>
        <select
          value={type}
          onChange={e => setType(e.target.value)}
          className="bg-zinc-800 rounded px-3 py-2 text-sm"
        >
          {TYPES.map(t => (
            <option key={t} value={t}>{typeLabel(t)}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-3">
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-sm text-zinc-400">Value ({unit})</label>
          <input
            type="number"
            step="0.1"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder={`e.g. 75.5`}
            className="bg-zinc-800 rounded px-3 py-2 text-sm"
            required
          />
        </div>
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-sm text-zinc-400">Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            max={today}
            className="bg-zinc-800 rounded px-3 py-2 text-sm"
            required
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 py-2 rounded text-sm font-medium"
      >
        {submitting ? 'Logging...' : 'Log Measurement'}
      </button>
    </form>
  )
}
