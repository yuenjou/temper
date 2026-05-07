'use client'

import { useState } from 'react'
import ForgeIcon from '@/components/ForgeIcon'
import { upsertProfile } from './actions'

type Profile = {
  display_name: string | null
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
  boxSizing: 'border-box',
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

export default function ProfileCard({
  profile,
  emailPrefix,
  email,
}: {
  profile: Profile | null
  emailPrefix: string
  email: string
}) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [height, setHeight] = useState(profile?.height?.toString() ?? '')
  const [dob, setDob] = useState(profile?.date_of_birth ?? '')
  const [saving, setSaving] = useState(false)

  const name = profile?.display_name || emailPrefix
  const initials = name.charAt(0).toUpperCase()
  const hasHeight = !!profile?.height
  const hasDob = !!profile?.date_of_birth

  async function handleSave() {
    setSaving(true)
    try {
      await upsertProfile({
        display_name: displayName.trim() || null,
        height: height ? parseFloat(height) : null,
        height_unit: 'cm',
        date_of_birth: dob || null,
      })
      setSheetOpen(false)
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setDisplayName(profile?.display_name ?? '')
    setHeight(profile?.height?.toString() ?? '')
    setDob(profile?.date_of_birth ?? '')
    setSheetOpen(false)
  }

  return (
    <>
      <div className="forge-card" style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, var(--accent) 0%, #ff8a80 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, fontWeight: 700, color: '#fff',
        }}>
          {initials}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 18, margin: 0 }}>{name}</p>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 13, margin: '3px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '3px 10px',
              background: 'var(--accent-soft)', borderRadius: 'var(--r-pill)',
            }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.02em' }}>Member</span>
            </div>
            {hasHeight && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '3px 10px',
                background: 'var(--surface-2)', borderRadius: 'var(--r-pill)',
              }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {profile!.height} {profile!.height_unit}
                </span>
              </div>
            )}
            {hasDob && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '3px 10px',
                background: 'var(--surface-2)', borderRadius: 'var(--r-pill)',
              }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {calcAge(profile!.date_of_birth!)} yrs
                </span>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => setSheetOpen(true)}
          style={{
            background: 'var(--surface-2)', border: '0.5px solid var(--hairline-strong)',
            borderRadius: '50%', width: 36, height: 36, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <ForgeIcon name="settings" size={16} color="var(--text-secondary)" />
        </button>
      </div>

      {/* Settings Bottom Sheet */}
      {sheetOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'flex-end',
          }}
          onClick={e => { if (e.target === e.currentTarget) handleCancel() }}
        >
          <div style={{
            width: '100%', maxWidth: 480, margin: '0 auto',
            background: 'var(--surface-1)',
            backdropFilter: 'blur(20px) saturate(1.8)',
            WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
            borderRadius: '20px 20px 0 0',
            padding: '0 20px 40px',
            border: '0.5px solid rgba(255,255,255,0.08)',
          }}>
            {/* Handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 20px' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--surface-3, var(--hairline-strong))' }} />
            </div>

            <p style={{ fontWeight: 700, fontSize: 18, margin: '0 0 24px' }}>Profile Settings</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={labelStyle}>Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder={emailPrefix}
                  style={inputStyle}
                />
              </div>

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

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
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
                    flex: 1, background: 'var(--surface-2)', border: '0.5px solid var(--hairline-strong)',
                    borderRadius: 'var(--r-md)', padding: '10px 14px', fontSize: 15,
                    color: 'var(--text-primary)', cursor: 'pointer', fontFamily: 'inherit',
                    fontWeight: 500,
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
