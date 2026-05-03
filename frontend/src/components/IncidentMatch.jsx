import { useState } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'

export default function IncidentMatch({ incident }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded border border-[var(--border)] bg-[var(--surface-2)] overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[var(--surface)] transition-colors"
      >
        {open
          ? <ChevronDown className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
          : <ChevronRight className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
        }
        <span className="text-[11px] font-semibold text-blue-400">{incident.incident_id}</span>
        <span className="text-[var(--border)]">·</span>
        <span className="text-[11px] text-[var(--text-primary)] truncate">{incident.title}</span>
        <span className="text-[10px] text-[var(--text-muted)] shrink-0 ml-auto">{incident.date}</span>
      </button>

      {open && (
        <div className="px-3 pb-3 pt-1 space-y-2 border-t border-[var(--border)]">
          <div>
            <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-0.5">Root Cause</div>
            <div className="text-[11px] text-[var(--text-primary)]">{incident.root_cause}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-0.5">Resolution</div>
            <div className="text-[11px] text-[var(--text-primary)]">{incident.resolution}</div>
          </div>
          <div className="flex gap-4">
            <div>
              <div className="text-[10px] text-[var(--text-muted)]">Resolved in</div>
              <div className="text-[11px] text-[var(--text-primary)] font-semibold">{incident.time_to_resolve_min} min</div>
            </div>
            {incident.parts_used?.length > 0 && (
              <div>
                <div className="text-[10px] text-[var(--text-muted)]">Parts used</div>
                <div className="text-[11px] text-[var(--text-primary)]">{incident.parts_used.join(', ')}</div>
              </div>
            )}
          </div>
          <div>
            <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-0.5">Lesson Learned</div>
            <div className="text-[11px] text-amber-300/80">{incident.lessons_learned}</div>
          </div>
        </div>
      )}
    </div>
  )
}
