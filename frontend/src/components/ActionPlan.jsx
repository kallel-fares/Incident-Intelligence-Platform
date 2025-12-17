import { useState } from 'react'
import { Wrench, Package } from 'lucide-react'

export default function ActionPlan({ actions, tools, parts }) {
  const [checked, setChecked] = useState({})

  const toggle = (i) => setChecked(c => ({ ...c, [i]: !c[i] }))

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {actions?.map((item, i) => (
          <div
            key={i}
            className="flex gap-3 p-2 rounded border border-[var(--border)] bg-[var(--surface-2)]"
          >
            <button
              onClick={() => toggle(i)}
              className={`mt-0.5 w-4 h-4 shrink-0 rounded border flex items-center justify-center transition-colors ${
                checked[i]
                  ? 'bg-green-500 border-green-500'
                  : 'border-[var(--border)] hover:border-slate-500'
              }`}
            >
              {checked[i] && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2">
                <span className="text-[10px] font-bold text-[var(--text-muted)] shrink-0 mt-0.5">
                  {item.step}.
                </span>
                <span className={`text-[11px] text-[var(--text-primary)] leading-relaxed ${checked[i] ? 'line-through text-[var(--text-muted)]' : ''}`}>
                  {item.action}
                </span>
              </div>
              {item.reason && (
                <div className="text-[10px] text-[var(--text-muted)] mt-0.5 ml-4 italic">
                  {item.reason}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {(tools?.length > 0 || parts?.length > 0) && (
        <div className="grid grid-cols-2 gap-2">
          {tools?.length > 0 && (
            <div className="p-2 rounded border border-[var(--border)] bg-[var(--surface-2)]">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Wrench className="w-3 h-3 text-[var(--text-muted)]" />
                <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Tools</span>
              </div>
              <div className="space-y-0.5">
                {tools.map((t, i) => (
                  <div key={i} className="text-[10px] text-[var(--text-primary)]">· {t}</div>
                ))}
              </div>
            </div>
          )}
          {parts?.length > 0 && (
            <div className="p-2 rounded border border-[var(--border)] bg-[var(--surface-2)]">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Package className="w-3 h-3 text-[var(--text-muted)]" />
                <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Parts</span>
              </div>
              <div className="space-y-0.5">
                {parts.map((p, i) => (
                  <div key={i} className="text-[10px] text-[var(--text-primary)]">· {p}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
