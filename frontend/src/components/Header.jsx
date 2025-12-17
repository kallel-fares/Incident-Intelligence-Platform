import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'

export default function Header() {
  const { pathname } = useLocation()

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-[var(--border)] bg-[var(--surface)] shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-xs font-semibold tracking-widest text-[var(--text-muted)] uppercase">
          Meridian Data Centers
        </span>
        <span className="text-[var(--border)]">·</span>
        <span className="text-sm font-semibold text-[var(--text-primary)]">
          Incident Intelligence
        </span>
      </div>

      <nav className="flex gap-1">
        <Link
          to="/"
          className={cn(
            'px-3 py-1.5 rounded text-xs font-medium transition-colors',
            pathname === '/'
              ? 'bg-[var(--surface-2)] text-[var(--text-primary)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          )}
        >
          Incidents
        </Link>
        <Link
          to="/cost-model"
          className={cn(
            'px-3 py-1.5 rounded text-xs font-medium transition-colors',
            pathname === '/cost-model'
              ? 'bg-[var(--surface-2)] text-[var(--text-primary)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          )}
        >
          Cost Model
        </Link>
      </nav>
    </header>
  )
}
