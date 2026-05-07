'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ForgeIcon from './ForgeIcon'

const TABS = [
  { href: '/dashboard', label: 'Home', icon: 'spark', match: '/dashboard' },
  { href: '/workout/new', label: 'Workout', icon: 'dumbbell', match: '/workout' },
  { href: '/food', label: 'Food', icon: 'apple', match: '/food' },
  { href: '/stats', label: 'Stats', icon: 'bar-chart', match: '/stats' },
  { href: '/profile', label: 'Profile', icon: 'person', match: '/profile' },
]

export default function NavBar() {
  const pathname = usePathname()
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      background: 'linear-gradient(180deg, rgba(5,5,7,0.7) 0%, rgba(5,5,7,0.88) 100%)',
      backdropFilter: 'blur(40px) saturate(180%)',
      WebkitBackdropFilter: 'blur(40px) saturate(180%)',
      borderTop: '0.5px solid rgba(255,255,255,0.1)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      <div className="forge-main" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)' }}>
        {TABS.map(({ href, label, icon, match }) => {
          const active = pathname === match || pathname.startsWith(match + '/')
          return (
            <Link key={href} href={href} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              padding: '10px 0 12px',
              color: active ? 'var(--accent)' : 'var(--text-tertiary)',
              fontSize: 10, fontWeight: 600, letterSpacing: '0.02em',
              textDecoration: 'none', transition: 'color 0.15s ease',
            }}>
              <div style={{
                transform: active ? 'translateY(-1px) scale(1.08)' : 'translateY(0) scale(1)',
                transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}>
                <ForgeIcon name={icon} size={24} strokeWidth={active ? 2 : 1.75} />
              </div>
              {label}
              <div style={{
                width: active ? 18 : 0,
                height: 2.5,
                borderRadius: 2,
                background: 'var(--accent)',
                transition: 'width 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                marginTop: 1,
              }} />
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
