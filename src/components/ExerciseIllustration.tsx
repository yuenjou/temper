type Props = { name: string; size?: number }

export default function ExerciseIllustration({ name, size = 72 }: Props) {
  const accent = 'var(--accent)'
  const stroke = 'rgba(235,235,245,0.85)'
  const fill = 'rgba(255,255,255,0.04)'
  const muted = 'rgba(235,235,245,0.35)'
  const p = { width: size, height: size, viewBox: '0 0 100 100', fill: 'none' as const, strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

  switch (name) {
    case 'bench-press': return (
      <svg {...p}>
        <rect x="14" y="58" width="72" height="6" rx="2" stroke={stroke} fill={fill} />
        <path d="M22 64v18M78 64v18" stroke={stroke} />
        <line x1="10" y1="32" x2="90" y2="32" stroke={accent} strokeWidth={2.4} />
        <rect x="8" y="22" width="6" height="20" rx="1.5" stroke={accent} fill="none" strokeWidth={2} />
        <rect x="86" y="22" width="6" height="20" rx="1.5" stroke={accent} fill="none" strokeWidth={2} />
        <path d="M40 32l4 16M60 32l-4 16" stroke={muted} />
        <ellipse cx="50" cy="54" rx="14" ry="6" stroke={stroke} fill={fill} />
      </svg>
    )
    case 'squat': return (
      <svg {...p}>
        <line x1="20" y1="32" x2="80" y2="32" stroke={accent} strokeWidth={2.4} />
        <rect x="16" y="24" width="6" height="16" rx="1.5" stroke={accent} fill="none" strokeWidth={2} />
        <rect x="78" y="24" width="6" height="16" rx="1.5" stroke={accent} fill="none" strokeWidth={2} />
        <circle cx="50" cy="22" r="6" stroke={stroke} fill={fill} />
        <path d="M50 28v18M40 46h20M42 46l-6 18M58 46l6 18M36 64l4 16M64 64l-4 16" stroke={stroke} />
        <line x1="14" y1="84" x2="86" y2="84" stroke={muted} strokeDasharray="2 4" />
      </svg>
    )
    case 'deadlift': return (
      <svg {...p}>
        <circle cx="44" cy="20" r="6" stroke={stroke} fill={fill} />
        <path d="M44 26l14 24M58 50v22M56 50l-2 30M62 50l2 30" stroke={stroke} />
        <line x1="36" y1="74" x2="84" y2="74" stroke={accent} strokeWidth={2.4} />
        <rect x="32" y="66" width="6" height="16" rx="1.5" stroke={accent} fill="none" strokeWidth={2} />
        <rect x="82" y="66" width="6" height="16" rx="1.5" stroke={accent} fill="none" strokeWidth={2} />
        <line x1="14" y1="86" x2="86" y2="86" stroke={muted} strokeDasharray="2 4" />
      </svg>
    )
    case 'row': return (
      <svg {...p}>
        <circle cx="30" cy="36" r="6" stroke={stroke} fill={fill} />
        <path d="M34 42l24 8M58 50l14-6" stroke={stroke} />
        <rect x="70" y="40" width="10" height="6" rx="1.5" stroke={accent} fill={fill} strokeWidth={2} />
        <path d="M56 52v18M62 52l4 18" stroke={stroke} />
        <line x1="14" y1="74" x2="86" y2="74" stroke={muted} strokeDasharray="2 4" />
      </svg>
    )
    case 'press': return (
      <svg {...p}>
        <line x1="20" y1="14" x2="80" y2="14" stroke={accent} strokeWidth={2.4} />
        <rect x="16" y="6" width="6" height="16" rx="1.5" stroke={accent} fill="none" strokeWidth={2} />
        <rect x="78" y="6" width="6" height="16" rx="1.5" stroke={accent} fill="none" strokeWidth={2} />
        <path d="M40 14l6 22M60 14l-6 22" stroke={stroke} />
        <circle cx="50" cy="42" r="6" stroke={stroke} fill={fill} />
        <path d="M50 48v18M50 66l-6 18M50 66l6 18" stroke={stroke} />
      </svg>
    )
    case 'curl': return (
      <svg {...p}>
        <circle cx="50" cy="20" r="6" stroke={stroke} fill={fill} />
        <path d="M50 26v22M50 32l-12 14M38 46l10-8" stroke={stroke} />
        <rect x="42" y="32" width="10" height="6" rx="1.5" stroke={accent} fill={fill} strokeWidth={2} />
        <path d="M50 48l-6 30M50 48l6 30" stroke={stroke} />
      </svg>
    )
    default: return (
      <svg {...p}>
        <rect x="20" y="20" width="60" height="60" rx="8" stroke={muted} fill={fill} strokeDasharray="3 3" />
      </svg>
    )
  }
}
