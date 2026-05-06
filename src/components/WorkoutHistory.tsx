'use client'

import { useEffect, useRef, useState } from 'react'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
function fmtDate(iso: string) {
  const d = new Date(iso)
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`
}

import ForgeIcon from '@/components/ForgeIcon'
import { deleteWorkout } from '@/app/workout/new/actions'

type Workout = {
  id: string
  name: string | null
  started_at: string
  finished_at: string | null
}

const DELETE_W = 80
const FULL_DELETE = 200

function WorkoutRow({ workout, onDelete }: { workout: Workout; onDelete: () => void }) {
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [removing, setRemoving] = useState(false)
  const startX = useRef(0)
  const startY = useRef(0)
  const baseOffset = useRef(0)
  const directionLocked = useRef<'h' | 'v' | null>(null)

  useEffect(() => {
    if (removing) {
      const t = setTimeout(onDelete, 320)
      return () => clearTimeout(t)
    }
  }, [removing, onDelete])

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
    setOffset(Math.min(0, Math.max(-(FULL_DELETE + 20), baseOffset.current + dx)))
  }

  async function handleTouchEnd() {
    setDragging(false)
    if (offset < -FULL_DELETE) {
      setOffset(-window.innerWidth)
      await deleteWorkout(workout.id)
      setRemoving(true)
    } else if (offset < -DELETE_W / 2) {
      setOffset(-DELETE_W)
      setRevealed(true)
    } else {
      setOffset(0)
      setRevealed(false)
    }
  }

  async function handleDeleteClick() {
    setOffset(-window.innerWidth)
    await deleteWorkout(workout.id)
    setRemoving(true)
  }

  const deleteProgress = Math.min(1, Math.abs(offset) / DELETE_W)

  return (
    <div style={{
      maxHeight: removing ? 0 : 200,
      opacity: removing ? 0 : 1,
      overflow: 'hidden',
      transition: 'max-height 0.32s ease, opacity 0.25s ease',
    }}>
      <div style={{
        position: 'relative',
        overflow: 'hidden',
        borderBottom: '0.5px solid var(--hairline)',
      }}>
        {/* Delete zone */}
        <div
          role="button"
          aria-label="Delete workout"
          onClick={handleDeleteClick}
          style={{
            position: 'absolute', right: 0, top: 0, bottom: 0,
            width: Math.max(DELETE_W, Math.abs(offset)),
            background: '#ff3b30',
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
            paddingRight: 24,
            opacity: deleteProgress,
            cursor: 'pointer',
          }}
        >
          <ForgeIcon name="trash" size={20} color="#fff" />
        </div>

        {/* Row */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            transform: `translateX(${offset}px)`,
            transition: dragging ? 'none' : 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
            background: 'var(--surface-1)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 20px',
            userSelect: 'none', touchAction: 'pan-y', WebkitUserSelect: 'none',
          }}
        >
          <div>
            <p style={{ fontWeight: 600, margin: 0, fontSize: 15 }}>{workout.name ?? 'Workout'}</p>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 12, margin: '2px 0 0' }}>
              {fmtDate(workout.started_at)}
            </p>
          </div>
          <ForgeIcon name="chevron-right" size={16} color="var(--text-tertiary)" />
        </div>
      </div>
    </div>
  )
}

export default function WorkoutHistory({ workouts: initial }: { workouts: Workout[] }) {
  const [workouts, setWorkouts] = useState(initial)

  function remove(id: string) {
    setWorkouts(prev => prev.filter(w => w.id !== id))
  }

  if (workouts.length === 0) {
    return (
      <div className="forge-card" style={{ textAlign: 'center', padding: '24px 20px' }}>
        <p style={{ color: 'var(--text-tertiary)', fontSize: 14, margin: 0 }}>No workouts logged yet</p>
      </div>
    )
  }

  return (
    <div className="forge-card-flush">
      {workouts.map(workout => (
        <WorkoutRow
          key={workout.id}
          workout={workout}
          onDelete={() => remove(workout.id)}
        />
      ))}
    </div>
  )
}
