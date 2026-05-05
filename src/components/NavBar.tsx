'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

function DumbbellIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.4 14.4 9.6 9.6"/>
      <path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z"/>
      <path d="m21.5 21.5-1.4-1.4"/>
      <path d="M3.9 3.9 2.5 2.5"/>
      <path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z"/>
    </svg>
  )
}

function LayoutDashboardIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="7" height="9" x="3" y="3" rx="1"/>
      <rect width="7" height="5" x="14" y="3" rx="1"/>
      <rect width="7" height="9" x="14" y="12" rx="1"/>
      <rect width="7" height="5" x="3" y="16" rx="1"/>
    </svg>
  )
}

function RulerIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.3 8.7 8.7 21.3c-1 1-2.5 1-3.4 0l-2.6-2.6c-1-1-1-2.5 0-3.4L15.3 2.7c1-1 2.5-1 3.4 0l2.6 2.6c1 1 1 2.5 0 3.4"/>
      <path d="m7.5 10.5 2 2"/>
      <path d="m10.5 7.5 2 2"/>
      <path d="m13.5 4.5 2 2"/>
      <path d="m4.5 13.5 2 2"/>
    </svg>
  )
}

const NAV_ITEMS = [
  { href: '/workout/new', label: 'Workouts', Icon: DumbbellIcon, match: '/workout' },
  { href: '/dashboard', label: 'Dashboard', Icon: LayoutDashboardIcon, match: '/dashboard' },
  { href: '/measurements', label: 'Measurements', Icon: RulerIcon, match: '/measurements' },
]

export default function NavBar() {
  const pathname = usePathname()

  return (
    <nav className="w-full bg-zinc-900 border-b border-zinc-800">
      <div className="flex justify-around items-center h-14 max-w-2xl mx-auto px-4">
        {NAV_ITEMS.map(({ href, label, Icon, match }) => {
          const active = pathname === match || pathname.startsWith(match + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 text-xs font-medium px-4 py-2 transition-colors ${
                active ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Icon />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
