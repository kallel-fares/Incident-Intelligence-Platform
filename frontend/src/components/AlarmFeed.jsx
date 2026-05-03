import { useFetch } from '@/hooks/useApi'
import AlarmCard from './AlarmCard'
import { cn } from '@/lib/utils'
import { severityColor } from '@/utils/formatters'

export default function AlarmFeed({ selectedAlarm, onSelectAlarm }) {
  const { data, loading, error } = useFetch('/api/alarms')

  if (loading) return (
    <div className="flex items-center justify-center h-32 text-[var(--text-muted)] text-xs">
      Loading alarms…
    </div>
  )

  if (error) return (
    <div className="p-4 text-red-400 text-xs">Error: {error}</div>
  )

  return (
    <div className="flex flex-col gap-4 p-3">
      {data?.map(group => (
        <div key={group.scenario}>
          <div className="flex items-center gap-2 mb-2 px-1">
            <span
              className={cn(
                'text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded border uppercase',
                severityColor(group.worst_severity)
              )}
            >
              Scenario {group.scenario}
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">
              {group.alarms.length} alarm{group.alarms.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            {group.alarms.map(alarm => (
              <AlarmCard
                key={alarm.alarm_id}
                alarm={alarm}
                selected={selectedAlarm}
                onClick={onSelectAlarm}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
