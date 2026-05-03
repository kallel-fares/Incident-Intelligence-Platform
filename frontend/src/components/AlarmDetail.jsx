import { Zap } from 'lucide-react'
import { severityColor, severityLabel, formatTimestamp } from '@/utils/formatters'
import SensorChart from './SensorChart'

export default function AlarmDetail({ alarm, alarmData, onLaunch }) {
  const equipment = alarmData?.equipment
  const sensors   = alarmData?.sensors || []
  const loading   = !alarmData

  return (
    <div className="p-5 space-y-5">

      {/* Alarm header */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-bold px-2 py-0.5 rounded border ${severityColor(alarm.severity)}`}>
            {severityLabel(alarm.severity)}
          </span>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">{alarm.alarm_id}</span>
        </div>
        <h2 className="text-sm font-semibold text-[var(--text-primary)] leading-snug">
          {alarm.message}
        </h2>
        <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-[var(--text-muted)]">
          <span>{alarm.equipment_id}</span>
          <span>·</span>
          <span>{alarm.zone}</span>
          <span>·</span>
          <span>{formatTimestamp(alarm.timestamp)}</span>
        </div>
      </div>

      {/* Equipment card */}
      {loading ? (
        <div className="h-16 rounded border border-[var(--border)] bg-[var(--surface-2)] animate-pulse" />
      ) : equipment ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 p-3 rounded border border-[var(--border)] bg-[var(--surface-2)] text-[11px]">
          <div>
            <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider mb-0.5">Equipment</div>
            <div className="text-[var(--text-primary)] font-medium">{equipment.name}</div>
            <div className="text-[var(--text-muted)]">{equipment.model}</div>
          </div>
          <div>
            <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider mb-0.5">Zone / Loop</div>
            <div className="text-[var(--text-primary)]">{equipment.zone}</div>
            <div className="text-[var(--text-muted)]">
              {equipment.chiller_loop ? `Chiller Loop ${equipment.chiller_loop}` : 'No chiller loop'}
            </div>
          </div>
          <div>
            <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider mb-0.5">Last Maintenance</div>
            <div className="text-[var(--text-primary)]">{equipment.last_maintenance}</div>
          </div>
          {alarm.value !== null && alarm.value !== undefined && (
            <div>
              <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider mb-0.5">Reading / Threshold</div>
              <div className="text-red-400 font-semibold">{alarm.value}{alarm.unit}</div>
              <div className="text-[var(--text-muted)]">threshold: {alarm.threshold}{alarm.unit}</div>
            </div>
          )}
        </div>
      ) : null}

      {/* Sensor sparklines */}
      {sensors.length > 0 && (
        <div>
          <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-2">
            Sensor Trends · {sensors.length} stream{sensors.length !== 1 ? 's' : ''}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {sensors.map(s => (
              <SensorChart key={s.sensor_id} sensor={s} />
            ))}
          </div>
        </div>
      )}

      {/* Launch button */}
      <button
        onClick={onLaunch}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3 rounded border border-blue-500/50 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 hover:border-blue-400/70 transition-all font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Zap className="w-4 h-4" />
        Generate Incident Briefing
      </button>
    </div>
  )
}
