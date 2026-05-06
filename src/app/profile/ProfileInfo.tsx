'use client'

import { useState } from 'react'
import { upsertProfile } from './actions'

type Profile = {
  height: number | null
  height_unit: string
  date_of_birth: string | null
}

function calcAge(dob: string): number {
  const birth = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
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
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--text-tertiary)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  marginBottom: 6,
  display: 'block',
}

export default function ProfileInfo({ profile }: { profile: Profile | null }) {
  const [editing, setEditing] = useState(false)
  const [height, setHeight] = useState(profile?.height?.toString() ?? '')
  const [dob, setDob] = useState(profile?.date_of_birth ?? '')
  const [saving, setSaving] = useState(false)

  const hasHeight = !!profile?.height
  const hasDob = !!profile?.date_of_birth

  async function handleSave() {
    setSaving(true)
    try {
      await upsertProfile({
        height: height ? parseFloat(height) : null,
        height_unit: 'cm',
        date_of_birth: dob || null,
      })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <div className="forge-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p style={{ fontWeight: 600, fontSize: 15, margin: 0 }}>Physical Info</p>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Height (cm)</label>
            <input
              type="number"
              step="0.5"
              value={height}
              onChange={e => setHeight(e.target.value)}
              placeholder="e.g. 175"
              style={inputStyle}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Date of Birth</label>
            <input
              type="date"
              value={dob}
              onChange={e => setDob(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              style={inputStyle}
            />
          </div>
        </div>
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
            onClick={() => {
              setHeight(profile?.height?.toString() ?? '')
              setDob(profile?.date_of_birth ?? '')
              setEditing(false)
            }}
            style={{
              flex: 1, background: 'var(--surface-2)', border: '0.5px solid var(--hairline-strong)',
              borderRadius: 'var(--r-md)', padding: '10px 14px', fontSize: 15,
              color: 'var(--text-primary)', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="forge-card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1, display: 'flex', gap: 10 }}>
        <div style={{
          flex: 1, background: 'var(--surface-2)', borderRadius: 'var(--r-md)',
          padding: '10px 14px', textAlign: 'center',
        }}>
          <p style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
            {hasHeight ? `${profile!.height}` : '—'}
          </p>
          <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '3px 0 0' }}>
            {hasHeight ? profile!.height_unit : 'Height'}
          </p>
        </div>
        <div style={{
          flex: 1, background: 'var(--surface-2)', borderRadius: 'var(--r-md)',
          padding: '10px 14px', textAlign: 'center',
        }}>
          <p style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
            {hasDob ? calcAge(profile!.date_of_birth!) : '—'}
          </p>
          <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '3px 0 0' }}>Age</p>
        </div>
      </div>
      <button
        onClick={() => setEditing(true)}
        style={{
          background: 'var(--surface-2)', border: '0.5px solid var(--hairline-strong)',
          borderRadius: 'var(--r-md)', padding: '8px 14px', fontSize: 13,
          color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit',
          fontWeight: 500, flexShrink: 0,
        }}
      >
        {hasHeight || hasDob ? 'Edit' : 'Add'}
      </button>
    </div>
  )
}
