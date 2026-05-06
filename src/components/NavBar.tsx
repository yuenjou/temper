'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ForgeIcon from './ForgeIcon'

const TABS = [
  { href: '/dashboard', label: 'Home', icon: 'home', match: '/dashboard' },
  { href: '/workout/new', label: 'Workout', icon: 'dumbbell', match: '/workout' },
  { href: '/food', label: 'Food', icon: 'apple', match: '/food' },
  { href: '/profile', label: 'Profile', icon: 'profile', match: '/profile' },
]

export default function NavBar() {
  const pathname = usePathname()
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(18,18,20,0.92)',
      backdropFilter: 'saturate(180%) blur(24px)',
      WebkitBackdropFilter: 'saturate(180%) blur(24px)',
      borderTop: '0.5px solid var(--hairline)',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      <div className="forge-main" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {TABS.map(({ href, label, icon, match }) => {
          const active = pathname === match || pathname.startsWith(match + '/')
          return (
            <Link key={href} href={href} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              padding: '10px 0 14px',
              color: active ? 'var(--accent)' : 'var(--text-tertiary)',
              fontSize: 10, fontWeight: 600, letterSpacing: '0.02em',
              textDecoration: 'none', transition: 'color 0.15s ease',
            }}>
              <ForgeIcon name={icon} size={24} strokeWidth={active ? 2 : 1.75} />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
