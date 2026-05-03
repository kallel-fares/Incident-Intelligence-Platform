import { useState, useEffect } from 'react'
import { useFetch, postApi } from '@/hooks/useApi'
import { severityColor, severityLabel, confidenceColor, formatTimestamp } from '@/utils/formatters'
import { buildTraceSteps } from '@/utils/traceBuilder'
import AlarmDetail from './AlarmDetail'
import ReasoningTrace from './ReasoningTrace'
import ToolPipeline from './ToolPipeline'
import SensorChart from './SensorChart'
import IncidentMatch from './IncidentMatch'
import DocumentRef from './DocumentRef'
import ActionPlan from './ActionPlan'
import CostFooter from './CostFooter'
import { AlertTriangle, Clock, TrendingUp, ChevronDown, ChevronRight } from 'lucide-react'

// ─── small helpers ────────────────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <div className="space-y-2">
      <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">
        {title}
      </div>
      {children}
    </div>
  )
}

function CompactAlarmHeader({ alarm }) {
  return (
    <div className="flex items-center gap-2 flex-wrap pb-3 border-b border-[var(--border)]">
      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${severityColor(alarm.severity)}`}>
        {severityLabel(alarm.severity)}
      </span>
      <span className="text-xs font-semibold text-[var(--text-primary)]">{alarm.equipment_id}</span>
      <span className="text-[var(--border)]">·</span>
      <span className="text-[11px] text-[var(--text-muted)] truncate flex-1">{alarm.message}</span>
      <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] shrink-0">
        <Clock className="w-3 h-3" />
        {formatTimestamp(alarm.timestamp)}
      </div>
    </div>
  )
}

function BriefingContent({ briefing, incidentsMap, docsMap }) {
  return (
    <div className="space-y-5">
      {/* Summary + severity */}
      <div className="space-y-1.5">
        <p className="text-sm text-[var(--text-primary)] leading-relaxed font-medium">
          {briefing.summary}
        </p>
        {briefing.severity_assessment && (
          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
            {briefing.severity_assessment}
          </p>
        )}
      </div>

      {/* Probable causes */}
      {briefing.probable_causes?.length > 0 && (
        <Section title="Probable Causes">
          <div className="space-y-1.5">
            {briefing.probable_causes.map((pc, i) => (
              <div key={i} className="flex gap-3 p-2.5 rounded border border-[var(--border)] bg-[var(--surface-2)]">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 self-start mt-0.5 ${confidenceColor(pc.confidence)}`}>
                  {(pc.confidence || '').toUpperCase()}
                </span>
                <div>
                  <div className="text-[11px] font-semibold text-[var(--text-primary)]">{pc.cause}</div>
                  <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{pc.basis}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Correlated signals */}
      {briefing.correlated_signals?.length > 0 && (
        <Section title="Correlated Signals">
          <div className="space-y-1.5">
            {briefing.correlated_signals.map((sig, i) => (
              <div key={i} className="flex gap-3 p-2 rounded border border-[var(--border)] bg-[var(--surface-2)]">
                <TrendingUp className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[11px] font-medium text-amber-300">{sig.signal}</div>
                  <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{sig.relevance}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Similar past incidents */}
      {briefing.similar_incidents?.length > 0 && (
        <Section title="Similar Past Incidents">
          <div className="space-y-1.5">
            {briefing.similar_incidents.map((ref, i) => {
              const fullInc = incidentsMap[ref.incident_id]
              if (fullInc) return <IncidentMatch key={i} incident={fullInc} />
              return (
                <div key={i} className="p-2 rounded border border-[var(--border)] bg-[var(--surface-2)]">
                  <span className="text-[11px] text-blue-400 font-semibold">{ref.incident_id}</span>
                  <span className="text-[10px] text-[var(--text-muted)] ml-2">{ref.summary}</span>
                </div>
              )
            })}
          </div>
        </Section>
      )}

      {/* Action plan */}
      {briefing.recommended_actions?.length > 0 && (
        <Section title="Recommended Actions">
          <ActionPlan
            actions={briefing.recommended_actions}
            tools={briefing.required_tools}
            parts={briefing.required_parts}
          />
        </Section>
      )}

      {/* Relevant documents */}
      {briefing.relevant_documents?.length > 0 && (
        <Section title="Relevant Documents">
          <div className="space-y-1.5">
            {briefing.relevant_documents.map((ref, i) => (
              <DocumentRef key={i} docRef={ref} documents={docsMap} />
            ))}
          </div>
        </Section>
      )}

      {/* Escalation */}
      {briefing.escalation && (
        <Section title="Escalation Criteria">
          <div className="p-2.5 rounded border border-amber-500/30 bg-amber-500/5 text-[11px] text-amber-300/90">
            {briefing.escalation}
          </div>
        </Section>
      )}

      {/* Resolution time */}
      {briefing.estimated_resolution_time && (
        <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
          <Clock className="w-3 h-3" />
          <span>Estimated resolution:</span>
          <span className="text-[var(--text-primary)] font-medium">
            {briefing.estimated_resolution_time}
          </span>
        </div>
      )}
    </div>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

export default function BriefingPanel({ alarm }) {
  const [phase,          setPhase]          = useState('detail')   // 'detail' | 'tracing' | 'done'
  const [traceSteps,     setTraceSteps]     = useState([])
  const [traceCollapsed, setTraceCollapsed] = useState(false)
  const [liveData,       setLiveData]       = useState(null)
  const [regenerating,   setRegenerating]   = useState(false)
  const [regenError,     setRegenError]     = useState(null)

  // Reset whenever alarm changes
  useEffect(() => {
    setPhase('detail')
    setTraceSteps([])
    setTraceCollapsed(false)
    setLiveData(null)
    setRegenError(null)
    setRegenerating(false)
  }, [alarm?.alarm_id])

  // Background data fetches — always running
  const { data: alarmData }     = useFetch(alarm ? `/api/alarms/${alarm.alarm_id}` : null)
  const { data: pregenData }    = useFetch(alarm ? `/api/briefing/${alarm.scenario}` : null)
  const { data: docsData }      = useFetch('/api/documents')
  const { data: incidentsData } = useFetch('/api/incidents')

  const displayData = liveData || pregenData
  const briefing    = displayData?.briefing

  const docsMap = docsData
    ? Object.fromEntries(docsData.map(d => [d.doc_id, d]))
    : {}
  const incidentsMap = incidentsData
    ? Object.fromEntries(incidentsData.map(i => [i.incident_id, i]))
    : {}

  // ── handlers ────────────────────────────────────────────────────────────────

  function handleLaunch() {
    const steps = buildTraceSteps({
      alarm,
      sensors:    alarmData?.sensors   || [],
      incidents:  incidentsData        || [],
      equipment:  alarmData?.equipment,
    })
    setTraceSteps(steps)
    setPhase('tracing')
  }

  function handleTraceComplete() {
    setPhase('done')
  }

  async function handleRegenerate() {
    setRegenerating(true)
    setRegenError(null)
    try {
      const result = await postApi('/api/briefing/generate', { alarm_id: alarm.alarm_id })
      setLiveData(result)
      // Replay trace with live token data reflected via meta override
      const steps = buildTraceSteps({
        alarm,
        sensors:   alarmData?.sensors  || [],
        incidents: incidentsData       || [],
        equipment: alarmData?.equipment,
      })
      setTraceSteps(steps)
      setTraceCollapsed(false)
      setPhase('tracing')
    } catch (e) {
      setRegenError(e.message)
    } finally {
      setRegenerating(false)
    }
  }

  // ── empty state ─────────────────────────────────────────────────────────────

  if (!alarm) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] gap-3">
        <AlertTriangle className="w-8 h-8 opacity-20" />
        <div className="text-sm">Select an alarm to begin</div>
        <div className="text-xs">Scenario C shows the most complex case</div>
      </div>
    )
  }

  // ── phase: detail ────────────────────────────────────────────────────────────

  if (phase === 'detail') {
    return (
      <div className="overflow-y-auto h-full">
        <AlarmDetail alarm={alarm} alarmData={alarmData} onLaunch={handleLaunch} />
      </div>
    )
  }

  // ── phase: tracing | done ─────────────────────────────────────────────────────
  // Single container shared across both phases so React keeps the same
  // ReasoningTrace DOM node — preserving scroll position on transition.

  if (phase === 'tracing' || phase === 'done') {
    return (
      <div className="overflow-y-auto h-full">
        <div className="p-5 space-y-4">
          <CompactAlarmHeader alarm={alarm} />

          <div>
            {phase === 'done' ? (
              <button
                onClick={() => setTraceCollapsed(c => !c)}
                className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-2 hover:text-[var(--text-primary)] transition-colors"
              >
                {traceCollapsed
                  ? <ChevronRight className="w-3 h-3" />
                  : <ChevronDown  className="w-3 h-3" />
                }
                Reasoning Trace
              </button>
            ) : (
              <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-2">
                Correlation Engine
              </div>
            )}
            <ToolPipeline steps={traceSteps} skipAnimation={phase === 'done'} />
            {(phase === 'tracing' || !traceCollapsed) && (
              <ReasoningTrace
                steps={traceSteps}
                onComplete={phase === 'tracing' ? handleTraceComplete : null}
                skipAnimation={phase === 'done'}
              />
            )}
          </div>

          {phase === 'done' && (briefing ? (
            <>
              <div className="h-px bg-[var(--border)]" />
              <Section title="Incident Briefing">
                <BriefingContent
                  briefing={briefing}
                  incidentsMap={incidentsMap}
                  docsMap={docsMap}
                />
              </Section>

              {regenError && (
                <div className="text-[11px] text-red-400 p-2 rounded border border-red-500/30 bg-red-500/5">
                  Live generation failed: {regenError}
                </div>
              )}

              <CostFooter
                briefingMeta={displayData}
                onRegenerate={handleRegenerate}
                regenerating={regenerating}
              />
            </>
          ) : (
            <div className="text-[11px] text-[var(--text-muted)]">Loading briefing…</div>
          ))}
        </div>
      </div>
    )
  }
}
