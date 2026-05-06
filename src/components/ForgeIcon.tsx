type IconProps = {
  name: string
  size?: number
  color?: string
  strokeWidth?: number
}

export default function ForgeIcon({ name, size = 22, color = 'currentColor', strokeWidth = 1.75 }: IconProps) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none' as const, stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (name) {
    case 'home': return <svg {...p}><path d="M3 11.5L12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-8.5z" /></svg>
    case 'dumbbell': return <svg {...p}><path d="M6 8v8M3 10v4M18 8v8M21 10v4M6 12h12" /></svg>
    case 'chart': return <svg {...p}><path d="M3 20h18M6 17V11M11 17V7M16 17v-4M21 17V9" /></svg>
    case 'profile': return <svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" /></svg>
    case 'play': return <svg {...p}><path d="M7 5l12 7-12 7V5z" fill={color} /></svg>
    case 'pause': return <svg {...p}><rect x="7" y="5" width="3.5" height="14" rx="1" fill={color} stroke="none" /><rect x="13.5" y="5" width="3.5" height="14" rx="1" fill={color} stroke="none" /></svg>
    case 'plus': return <svg {...p}><path d="M12 5v14M5 12h14" /></svg>
    case 'minus': return <svg {...p}><path d="M5 12h14" /></svg>
    case 'check': return <svg {...p}><path d="M5 12.5l4.5 4.5L19 7" /></svg>
    case 'chevron-right': return <svg {...p}><path d="M9 6l6 6-6 6" /></svg>
    case 'chevron-left': return <svg {...p}><path d="M15 6l-6 6 6 6" /></svg>
    case 'chevron-down': return <svg {...p}><path d="M6 9l6 6 6-6" /></svg>
    case 'close': return <svg {...p}><path d="M6 6l12 12M18 6L6 18" /></svg>
    case 'flame': return <svg {...p}><path d="M12 3c1 4 5 5 5 10a5 5 0 1 1-10 0c0-2 1-3 2-4-.5 2 .5 3 1.5 3 0-3 1-6 1.5-9z" /></svg>
    case 'bolt': return <svg {...p}><path d="M13 3L5 14h6l-1 7 8-11h-6l1-7z" /></svg>
    case 'clock': return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
    case 'calendar': return <svg {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
    case 'trend-up': return <svg {...p}><path d="M3 17l6-6 4 4 8-8" /><path d="M14 7h7v7" /></svg>
    case 'heart': return <svg {...p}><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" /></svg>
    case 'settings': return <svg {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>
    case 'skip': return <svg {...p}><path d="M5 5l9 7-9 7V5zM19 5v14" /></svg>
    case 'more': return <svg {...p}><circle cx="5" cy="12" r="1.5" fill={color} stroke="none" /><circle cx="12" cy="12" r="1.5" fill={color} stroke="none" /><circle cx="19" cy="12" r="1.5" fill={color} stroke="none" /></svg>
    case 'search': return <svg {...p}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
    case 'trophy': return <svg {...p}><path d="M8 4h8v4a4 4 0 1 1-8 0V4zM6 4H3v2a3 3 0 0 0 3 3M18 4h3v2a3 3 0 0 1-3 3M9 17h6M10 13l-1 4h6l-1-4M12 20v-3" /></svg>
    case 'ruler': return <svg {...p}><path d="M21.3 8.7 8.7 21.3c-1 1-2.5 1-3.4 0l-2.6-2.6c-1-1-1-2.5 0-3.4L15.3 2.7c1-1 2.5-1 3.4 0l2.6 2.6c1 1 1 2.5 0 3.4" /><path d="m7.5 10.5 2 2" /><path d="m10.5 7.5 2 2" /><path d="m13.5 4.5 2 2" /><path d="m4.5 13.5 2 2" /></svg>
    case 'info': return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8v.01" /></svg>
    case 'apple': return <svg {...p}><path d="M12 5c-1 0-2.5-.5-3-1.5C9.5 4.5 10 6 10 7c0 2.2-1.8 4-4 4-.7 0-1.4-.2-2-.5C4.7 12 5 14 6 15.5c.9 1.4 2 2.5 3 2.5.6 0 1.1-.3 1.5-.5.4.2.9.5 1.5.5s1.1-.3 1.5-.5c.4.2.9.5 1.5.5 1 0 2.1-1.1 3-2.5 1-1.5 1.3-3.5 1-5-.6.3-1.3.5-2 .5-2.2 0-4-1.8-4-4 0-1 .5-2.5 1-3C13.5 4.5 13 5 12 5z" /></svg>
    case 'water': return <svg {...p}><path d="M12 2L6 10a6 6 0 1 0 12 0L12 2z" /></svg>
    case 'pencil': return <svg {...p}><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>
    default: return null
  }
}
