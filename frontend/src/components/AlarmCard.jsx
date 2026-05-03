import { cn } from '@/lib/utils'
import { severityColor, severityDot, formatTimestamp } from '@/utils/formatters'

export default function AlarmCard({ alarm, selected, onClick }) {
  const isSelected = selected?.alarm_id === alarm.alarm_id

  return (
    <button
      onClick={() => onClick(alarm)}
      className={cn(
        'w-full text-left px-3 py-2.5 rounded border transition-all',
        isSelected
          ? 'border-[var(--info)] bg-blue-500/5'
          : 'border-[var(--border)] bg-[var(--surface-2)] hover:border-slate-500/60'
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 text-xs px-1.5 py-0.5 rounded border font-medium',
            severityColor(alarm.severity)
          )}
        >
          <span className={cn('w-1.5 h-1.5 rounded-full', severityDot(alarm.severity))} />
          {alarm.severity.toUpperCase()}
        </span>
        <span className="text-[10px] text-[var(--text-muted)] shrink-0">
          {formatTimestamp(alarm.timestamp)}
        </span>
      </div>

      <div className="text-xs font-semibold text-[var(--text-primary)] mb-0.5">
        {alarm.equipment_id}
      </div>
      <div className="text-[11px] text-[var(--text-muted)] truncate">
        {alarm.message}
      </div>
      {alarm.value !== null && alarm.value !== undefined && (
        <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
          {alarm.value}{alarm.unit} · {alarm.zone}
        </div>
      )}
    </button>
  )
}
