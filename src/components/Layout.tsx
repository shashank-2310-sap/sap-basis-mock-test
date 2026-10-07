import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { APP_TITLE } from '../bank'
import { ModeToggle } from '@/components/mode-toggle'
import { cn } from '@/lib/utils'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/test', label: 'Test Mode', end: false },
  { to: '/practice', label: 'Practice', end: false },
  { to: '/reports', label: 'Progress', end: false },
]

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-primary/20 bg-primary text-primary-foreground shadow">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <NavLink to="/" className="text-lg font-extrabold tracking-tight">
            {APP_TITLE}
          </NavLink>
          <div className="flex items-center gap-2">
            <nav aria-label="Main">
              <ul className="flex gap-1 text-sm font-medium">
                {links.map((l) => (
                  <li key={l.to}>
                    <NavLink
                      to={l.to}
                      end={l.end}
                      className={({ isActive }) =>
                        cn(
                          'rounded-md px-3 py-1.5 transition-colors',
                          isActive
                            ? 'bg-background text-foreground'
                            : 'text-primary-foreground/80 hover:bg-primary-foreground/15',
                        )
                      }
                    >
                      {l.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
            <ModeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </div>
  )
}
