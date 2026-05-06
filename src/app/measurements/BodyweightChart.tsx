'use client'

type Entry = { value: number; recorded_at: string }

const W = 320
const H = 110
const PAD = { top: 12, right: 12, bottom: 26, left: 38 }
const IW = W - PAD.left - PAD.right
const IH = H - PAD.top - PAD.bottom

export default function BodyweightChart({ entries }: { entries: Entry[] }) {
  if (entries.length < 2) return null

  const sorted = [...entries].sort((a, b) => a.recorded_at.localeCompare(b.recorded_at))
  const values = sorted.map(e => e.value)
  const rawMin = Math.min(...values)
  const rawMax = Math.max(...values)
  const pad = (rawMax - rawMin) * 0.15 || 2
  const min = rawMin - pad
  const max = rawMax + pad
  const range = max - min

  const toX = (i: number) => PAD.left + (i / (sorted.length - 1)) * IW
  const toY = (v: number) => PAD.top + ((max - v) / range) * IH

  const points = sorted.map((e, i) => `${toX(i).toFixed(1)},${toY(e.value).toFixed(1)}`).join(' ')

  const yTicks = [rawMin, (rawMin + rawMax) / 2, rawMax].map(v => Math.round(v * 10) / 10)

  const xIndices = Array.from(new Set([
    0,
    Math.round((sorted.length - 1) / 2),
    sorted.length - 1,
  ]))

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
      aria-hidden="true"
    >
      {yTicks.map(v => (
        <g key={v}>
          <line
            x1={PAD.left} y1={toY(v)}
            x2={W - PAD.right} y2={toY(v)}
            stroke="var(--hairline)" strokeWidth={0.5}
          />
          <text
            x={PAD.left - 6} y={toY(v) + 4}
            textAnchor="end" fontSize={9}
            fill="var(--text-tertiary)"
          >
            {v}
          </text>
        </g>
      ))}

      <polyline
        points={points}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {sorted.map((e, i) => (
        <circle
          key={i}
          cx={toX(i)} cy={toY(e.value)}
          r={3} fill="var(--accent)"
        />
      ))}

      {xIndices.map(i => {
        const d = new Date(sorted[i].recorded_at)
        const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        return (
          <text
            key={i}
            x={toX(i)} y={H - 4}
            textAnchor={i === 0 ? 'start' : i === sorted.length - 1 ? 'end' : 'middle'}
            fontSize={9}
            fill="var(--text-tertiary)"
          >
            {label}
          </text>
        )
      })}
    </svg>
  )
}
